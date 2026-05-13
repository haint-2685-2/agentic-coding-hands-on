import { createClient, type SupabaseClient, type User } from './deps.ts';
import { err } from './http.ts';

export type AppUser = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  locale: 'vi' | 'en' | 'ja';
  role: 'user' | 'admin';
  is_active: boolean;
  department_id: string | null;
  department_name: string | null;
};

export type AuthContext = {
  user: User;
  appUser: AppUser;
  jwt: string;
  /** Caller-scoped client (uses the caller's JWT — RLS applies). */
  supabase: SupabaseClient;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function callerClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export class AuthError extends Error {
  constructor(public response: Response) {
    super('auth');
  }
}

export async function requireUser(req: Request): Promise<AuthContext> {
  const authz = req.headers.get('authorization');
  if (!authz || !authz.toLowerCase().startsWith('bearer ')) {
    throw new AuthError(err(401, 'auth/required', 'Authentication required.'));
  }
  const jwt = authz.slice(7).trim();
  const supabase = callerClient(jwt);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const msg = (error?.message ?? '').toLowerCase();
    if (msg.includes('expired')) {
      throw new AuthError(err(401, 'auth/expired', 'Access token expired.'));
    }
    throw new AuthError(err(401, 'auth/invalid-token', 'Invalid or malformed token.'));
  }
  const svc = serviceClient();
  // Embed the department row so callers can render `department_name` without
  // an extra round-trip. PostgREST returns `department: { name }` when the FK
  // is named or implicit; we explicitly alias to `department_name`.
  const { data: row, error: rowErr } = await svc
    .from('app_user')
    .select(
      'id, auth_user_id, email, full_name, avatar_url, locale, role, is_active, department_id, department:department_id ( name )',
    )
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  if (rowErr || !row) {
    throw new AuthError(err(401, 'auth/no-profile', 'No app_user row for this principal.'));
  }
  if (!row.is_active) {
    throw new AuthError(err(403, 'auth/account-disabled', 'This account has been disabled.'));
  }
  const dept = (row as unknown as { department: { name: string } | null }).department;
  const appUser: AppUser = {
    id: row.id,
    auth_user_id: row.auth_user_id,
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    locale: row.locale,
    role: row.role,
    is_active: row.is_active,
    department_id: row.department_id,
    department_name: dept?.name ?? null,
  };
  return { user: data.user, appUser, jwt, supabase };
}
