import { createClient, createJwt, getNumericDate, SupabaseClient } from './deps.ts';
import { ENV } from './env.ts';

let _admin: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

let _jwtKey: CryptoKey | null = null;
async function jwtKey(): Promise<CryptoKey> {
  if (_jwtKey) return _jwtKey;
  _jwtKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENV.SUPABASE_JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  return _jwtKey;
}

/**
 * Mint a Supabase-style JWT for a given auth user id.
 * Mirrors the structure Supabase Auth issues on real sign-in so that
 * Edge Functions calling `supabase.auth.getUser(jwt)` accept it.
 */
export async function signTokenForUser(
  authUserId: string,
  opts: { email?: string; role?: 'authenticated' | 'anon'; ttlSeconds?: number } = {},
): Promise<string> {
  const key = await jwtKey();
  const payload = {
    aud: 'authenticated',
    role: opts.role ?? 'authenticated',
    sub: authUserId,
    email: opts.email ?? '',
    iat: getNumericDate(0),
    exp: getNumericDate(opts.ttlSeconds ?? 3600),
    iss: `${ENV.SUPABASE_URL}/auth/v1`,
  };
  return await createJwt({ alg: 'HS256', typ: 'JWT' }, payload, key);
}

export type CreatedUser = {
  authUserId: string;
  email: string;
  appUserId: string;
};

let userCounter = 0;
function uniqueEmail(prefix = 'tester'): string {
  userCounter += 1;
  return `${prefix}-${Date.now()}-${userCounter}@sun-asterisk.com`;
}

/**
 * Provision a user via the Admin API. This INSERTs into auth.users, which
 * fires `fn_handle_new_auth_user` and upserts the matching app_user row.
 *
 * NOTE: admin.createUser bypasses `before_user_created` hook in current
 * Supabase versions. We test the hook separately via pgTAP.
 */
export async function createTestUser(opts: {
  email?: string;
  fullName?: string;
  locale?: 'vi' | 'en' | 'ja';
  role?: 'user' | 'admin';
  isActive?: boolean;
} = {}): Promise<CreatedUser> {
  const email = opts.email ?? uniqueEmail();
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: opts.fullName ?? 'Test User',
      cookie_locale: opts.locale ?? 'vi',
      email_verified: true,
    },
  });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);

  // Apply role / is_active overrides if requested.
  if (opts.role && opts.role !== 'user') {
    const { error: e } = await admin
      .from('app_user')
      .update({ role: opts.role })
      .eq('auth_user_id', data.user.id);
    if (e) throw new Error(`role update failed: ${e.message}`);
  }
  if (opts.isActive === false) {
    const { error: e } = await admin
      .from('app_user')
      .update({ is_active: false })
      .eq('auth_user_id', data.user.id);
    if (e) throw new Error(`is_active update failed: ${e.message}`);
  }

  const { data: row, error: rowErr } = await admin
    .from('app_user')
    .select('id')
    .eq('auth_user_id', data.user.id)
    .single();
  if (rowErr || !row) throw new Error(`app_user row missing after createUser: ${rowErr?.message}`);

  return { authUserId: data.user.id, email, appUserId: row.id };
}

export async function truncateAppUserAndAuthUsers(): Promise<void> {
  const admin = adminClient();
  // Delete via admin auth API cascades to app_user via FK on delete.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  for (const u of data.users) {
    await admin.auth.admin.deleteUser(u.id);
  }
}

export async function callFn(
  path: string,
  init: { method?: string; jwt?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.jwt) headers['authorization'] = `Bearer ${init.jwt}`;
  const res = await fetch(`${ENV.FUNCTIONS_URL}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    /* leave as text */
  }
  return { status: res.status, body, headers: res.headers };
}
