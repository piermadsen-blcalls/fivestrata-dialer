import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Server-only env (service key) must never appear here or in NEXT_PUBLIC_*.
  poweredByHeader: false,
};

export default nextConfig;
