import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@flyrank/flyscrape', 'puppeteer-extra-plugin-stealth', 'puppeteer-extra-plugin', 'playwright-extra', 'playwright'],
};

export default nextConfig;
