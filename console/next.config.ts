import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Server-only env (service key) must never appear here or in NEXT_PUBLIC_*.
  poweredByHeader: false,
  // The engine repo above us has its own lockfile; pin tracing to the app.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
