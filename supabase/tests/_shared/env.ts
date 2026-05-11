/**
 * Resolve test-time connection info to the local Supabase stack.
 *
 * Reads from env vars (preferred) or falls back to the documented Supabase
 * local defaults. Tests run after `supabase start`; the env vars below are
 * printed by that command and must be exported (or sourced via
 * `tests/_shared/load-env.sh`) before `deno test`.
 */

function must(name: string, fallback?: string): string {
  const v = Deno.env.get(name);
  if (v && v.length > 0) return v;
  if (fallback !== undefined) return fallback;
  throw new Error(
    `Required env var ${name} is unset. Run \`supabase start\` and export the printed keys, ` +
      `or copy supabase/.env.local.example to supabase/.env.local and source it.`,
  );
}

export const ENV = {
  SUPABASE_URL: must('SUPABASE_URL', 'http://127.0.0.1:54321'),
  SUPABASE_ANON_KEY: must('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: must('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_JWT_SECRET: must(
    'SUPABASE_JWT_SECRET',
    'super-secret-jwt-token-with-at-least-32-characters-long',
  ),
  FUNCTIONS_URL: Deno.env.get('SUPABASE_FUNCTIONS_URL') ?? 'http://127.0.0.1:54321/functions/v1',
};
