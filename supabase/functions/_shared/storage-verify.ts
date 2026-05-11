import type { SupabaseClient } from './deps.ts';

export type VerifiedImage = { path: string; mime: string; size_bytes: number };

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png']);
const MAX_BYTES = 5 * 1024 * 1024;

export type VerifyResult =
  | { ok: true; images: VerifiedImage[] }
  | { ok: false; code: string; path?: string; message: string };

export async function verifyImagePaths(
  service: SupabaseClient,
  authUserId: string,
  paths: string[],
): Promise<VerifyResult> {
  const out: VerifiedImage[] = [];
  for (const p of paths) {
    if (!p.startsWith(`kudos/${authUserId}/`)) {
      return { ok: false, code: 'kudo/forbidden_path', path: p, message: 'Path outside caller namespace.' };
    }
    const folder = p.substring(0, p.lastIndexOf('/'));
    const filename = p.substring(p.lastIndexOf('/') + 1);
    const { data, error } = await service.storage.from('kudos').list(folder.replace(/^kudos\//, ''), {
      search: filename,
      limit: 1,
    });
    if (error) return { ok: false, code: 'kudo/invalid_image_path', path: p, message: error.message };
    const obj = data?.[0];
    if (!obj || obj.name !== filename) {
      return { ok: false, code: 'kudo/invalid_image_path', path: p, message: 'Storage object missing.' };
    }
    const meta = obj.metadata as { mimetype?: string; size?: number } | null | undefined;
    const mime = meta?.mimetype ?? '';
    const size = meta?.size ?? 0;
    if (!ALLOWED_MIMES.has(mime)) {
      return { ok: false, code: 'kudo/invalid_image_type', path: p, message: `MIME ${mime} not allowed.` };
    }
    if (size <= 0 || size > MAX_BYTES) {
      return { ok: false, code: 'kudo/invalid_image_size', path: p, message: `Size ${size} out of range.` };
    }
    out.push({ path: p, mime, size_bytes: size });
  }
  return { ok: true, images: out };
}
