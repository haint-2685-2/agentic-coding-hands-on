import { serve, z, ZodError } from '../_shared/deps.ts';
import { created, err, handleOptions, rateLimited } from '../_shared/http.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';
import { check as rateCheck } from '../_shared/rate-limit.ts';
import { normaliseHashtag } from '../_shared/hashtag-normalise.ts';
import { extractMentions, resolveMentions } from '../_shared/mentions.ts';
import { checkAndStore, makeDedupKey } from '../_shared/dedup.ts';
import { verifyImagePaths } from '../_shared/storage-verify.ts';

const BodySchema = z.object({
  receiver_id: z.string().uuid(),
  message: z.string().min(1).max(1000),
  hashtags: z.array(z.string().min(1)).min(1).max(5),
  image_paths: z.array(z.string()).max(5).default([]),
  is_anonymous: z.boolean().default(false),
  anonymous_display_name: z.string().max(50).nullable().optional(),
}).strict();

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return err(405, 'http/method-not-allowed', 'Only POST is allowed.');

  try {
    const ctx = await requireUser(req);

    const rl = rateCheck('kudos#post', ctx.appUser.id);
    if (!rl.ok) return rateLimited(rl.retryAfterSeconds);

    let parsed: z.infer<typeof BodySchema>;
    try {
      const raw = await req.json();
      parsed = BodySchema.parse(raw);
    } catch (e) {
      if (e instanceof ZodError) {
        const issue = e.issues[0];
        const path = issue.path.join('.');
        if (issue.code === 'too_big' && path === 'hashtags') {
          return err(422, 'validation/hashtags_max', 'At most 5 hashtags allowed.');
        }
        if (issue.code === 'too_big' && path === 'image_paths') {
          return err(422, 'validation/images_max', 'At most 5 images allowed.');
        }
        if (issue.code === 'too_big' && path === 'message') {
          return err(422, 'validation/message_max', 'Message exceeds 1000 chars.');
        }
        if (issue.code === 'too_small' || issue.code === 'invalid_type') {
          return err(422, 'validation/required', `Required field missing or invalid: ${path}`, [path]);
        }
        if (issue.code === 'unrecognized_keys') {
          return err(422, 'validation/unknown_keys', 'Unknown field in body.');
        }
        return err(422, 'validation/body', issue.message);
      }
      return err(400, 'http/invalid-json', 'Body must be valid JSON.');
    }

    // Self-receiver
    if (parsed.receiver_id === ctx.appUser.id) {
      return err(422, 'kudo/self_receiver', 'You cannot send a kudo to yourself.');
    }

    // Normalise hashtags
    const norm: { slug: string; name: string }[] = [];
    for (const t of parsed.hashtags) {
      const n = normaliseHashtag(t);
      if (!n.ok) return err(422, 'validation/hashtag_slug', 'Hashtag contains no valid characters.');
      norm.push({ slug: n.slug, name: n.name });
    }

    // Dedup check
    const dedupKey = makeDedupKey({
      sender: ctx.appUser.id,
      receiver: parsed.receiver_id,
      message: parsed.message,
      hashtags: norm.map((n) => n.slug),
    });
    const dup = await checkAndStore(dedupKey);
    if (dup.duplicate) {
      return err(409, 'kudo/duplicate', 'You just sent the same kudo to this person.');
    }

    const svc = serviceClient();

    // Verify image paths
    let verified: { path: string; mime: string; size_bytes: number }[] = [];
    if (parsed.image_paths.length > 0) {
      const v = await verifyImagePaths(svc, ctx.user.id, parsed.image_paths);
      if (!v.ok) {
        return err(v.code === 'kudo/forbidden_path' ? 403 : 422, v.code, v.message, v.path ? [v.path] : undefined);
      }
      verified = v.images;
    }

    // Mention resolution (best-effort)
    const tokens = extractMentions(parsed.message);
    const mentions = tokens.length > 0
      ? await resolveMentions(svc, tokens, [ctx.appUser.id, parsed.receiver_id])
      : [];

    // Transactional create via RPC — invoked under the caller's JWT so that
    // auth.uid() inside fn_create_kudo resolves to the sender.
    const { data, error } = await ctx.supabase.rpc('fn_create_kudo', {
      p_receiver_id: parsed.receiver_id,
      p_message: parsed.message,
      p_hashtags: norm.map((n) => n.slug),
      p_image_paths: verified.map((v) => v.path),
      p_image_mimes: verified.map((v) => v.mime),
      p_image_sizes: verified.map((v) => v.size_bytes),
      p_is_anonymous: parsed.is_anonymous,
      p_anonymous_display_name: parsed.is_anonymous
        ? (parsed.anonymous_display_name ?? 'Ẩn danh')
        : null,
      p_mentions: mentions,
    });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P0001') return err(422, 'kudo/self_receiver', 'You cannot send a kudo to yourself.');
      if (code === 'P0002') return err(404, 'user/not_found', 'Receiver not found.');
      if (code === 'P0003') return err(422, 'validation/hashtag_slug', 'Invalid hashtag.');
      if (code === '42501') return err(401, 'auth/required', 'Authentication required.');
      return err(500, 'internal/rpc-failed', error.message);
    }

    return created(data);
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
