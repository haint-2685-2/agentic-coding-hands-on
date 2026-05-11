export type ErrorBody = { error: { code: string; message: string; fields?: string[] } };

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function ok(body: unknown, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...corsHeaders, ...extraHeaders },
  });
}

export function created(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: { 'content-type': 'application/json', ...corsHeaders },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: { ...corsHeaders } });
}

export function err(status: number, code: string, message: string, fields?: string[]): Response {
  const body: ErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders },
  });
}

export function rateLimited(retryAfterSeconds: number, code = 'rate/limited'): Response {
  return new Response(JSON.stringify({ error: { code, message: 'Too many requests.' } }), {
    status: 429,
    headers: {
      'content-type': 'application/json',
      'retry-after': String(retryAfterSeconds),
      ...corsHeaders,
    },
  });
}

export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}
