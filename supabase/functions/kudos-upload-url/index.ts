import { serve, z, ZodError } from '../_shared/deps.ts';
import { err, handleOptions, ok } from '../_shared/http.ts';
import { AuthError, requireUser, serviceClient } from '../_shared/auth.ts';

const BodySchema = z.object({
  content_type: z.enum(['image/jpeg', 'image/png']),
}).strict();

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return err(405, 'http/method-not-allowed', 'Only POST is allowed.');

  try {
    const ctx = await requireUser(req);

    let parsed: z.infer<typeof BodySchema>;
    try {
      const raw = await req.json();
      parsed = BodySchema.parse(raw);
    } catch (e) {
      if (e instanceof ZodError) return err(422, 'validation/body', 'content_type must be image/jpeg or image/png.');
      return err(400, 'http/invalid-json', 'Body must be valid JSON.');
    }

    const ext = EXT_MAP[parsed.content_type];
    const uuid = crypto.randomUUID();
    const path = `${ctx.user.id}/${uuid}.${ext}`;

    const svc = serviceClient();
    const { data, error } = await svc.storage.from('kudos').createSignedUploadUrl(path);
    if (error || !data) return err(500, 'internal/storage', error?.message ?? 'Failed to create signed URL.');

    // Edge Function returns full path including bucket prefix that fn_create_kudo expects.
    return ok({ upload_url: data.signedUrl, token: data.token, path: `kudos/${path}` });
  } catch (e) {
    if (e instanceof AuthError) return e.response;
    return err(500, 'internal/unknown', 'Internal server error.');
  }
});
