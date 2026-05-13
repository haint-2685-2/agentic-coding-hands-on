/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Whitelist remote avatar/image hosts. Google OAuth profile photos come
    // from `lh3.googleusercontent.com`; Supabase Storage URLs from the local
    // dev stack (127.0.0.1:54321) or the project subdomain on cloud.
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'http', hostname: '127.0.0.1', port: '54321' },
      { protocol: 'http', hostname: 'localhost', port: '54321' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
