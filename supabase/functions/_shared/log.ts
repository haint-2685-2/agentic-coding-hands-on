const PII_KEYS = new Set([
  'email',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'full_name',
  'avatar_url',
  'name',
  'jwt',
  'otp',
  'phone',
]);

export function scrub(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(scrub);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = scrub(v);
      }
    }
    return out;
  }
  return value;
}

export type LogPayload = {
  fn: string;
  user_id?: string;
  status?: number;
  latency_ms?: number;
  error_code?: string;
  [k: string]: unknown;
};

export function logEvent(p: LogPayload): void {
  const scrubbed = scrub(p) as Record<string, unknown>;
  const out = { ts: new Date().toISOString(), ...scrubbed };
  console.log(JSON.stringify(out));
}
