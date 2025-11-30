import { chromium, firefox, webkit } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

/**
 * Supported browser engines for stealth mode.
 * Stealth mode is primarily designed for Chromium, but supported across all engines by the framework.
 */
export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

/**
 * Configures and returns a Playwright browser launcher with stealth techniques enabled.
 * 
 * This function leverages `playwright-extra` and `puppeteer-extra-plugin-stealth`
 * to apply various evasion techniques that prevent bot detection.
 * 
 * @param engine - The browser engine to use ('chromium', 'firefox', 'webkit'). Defaults to 'chromium'.
 * @returns The Playwright browser launcher with stealth plugins registered.
 * 
 * @example
 * ```ts
 * const browser = await enableStealth('chromium').launch();
 * const page = await browser.newPage();
 * await page.goto('https://bot.sannysoft.com');
 * ```
 */
export function enableStealth(engine: BrowserEngine = 'chromium') {
  const browserLauncher = { chromium, firefox, webkit }[engine];

  if (!browserLauncher) {
    throw new Error(`Unsupported browser engine: ${engine}`);
  }

  // Register the stealth plugin
  // This plugin includes evasions for:
  // - navigator.webdriver
  // - navigator.permissions
  // - navigator.languages
  // - navigator.plugins
  // - window.outerWidth/outerHeight
  // - generic sanitizer (stripping internal properties)
  // - ...and more
  browserLauncher.use(StealthPlugin());

  return browserLauncher;
}
