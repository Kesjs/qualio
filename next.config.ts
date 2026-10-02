import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/playwright-core/browsers.json'],
  },
};

export default nextConfig;
