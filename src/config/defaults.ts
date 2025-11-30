import type { BrowserConfig, CrawlerConfig } from '../core/types';

/**
 * Default configuration for the browser.
 */
export const DEFAULT_BROWSER_CONFIG: BrowserConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-spki-list',
    '--disable-blink-features=AutomationControlled',
  ],
  viewport: { width: 1280, height: 800 },
};

/**
 * Default configuration for the crawler.
 */
export const DEFAULT_CRAWLER_CONFIG: CrawlerConfig = {
  maxConcurrency: 5,
  cacheEnabled: true,
  verbose: false,
};

/**
 * Default user agent string.
 */
export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
