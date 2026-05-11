export function publicCache(maxAgeSeconds = 60): HeadersInit {
  return { 'cache-control': `public, max-age=${maxAgeSeconds}` };
}

export function privateNoStore(): HeadersInit {
  return { 'cache-control': 'private, no-store' };
}
