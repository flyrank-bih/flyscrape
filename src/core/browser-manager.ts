import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from 'playwright';
import { enableStealth } from '../stealth/stealth-injector';
import type { BrowserConfig } from './types';

/**
 * Manages the lifecycle of the browser instance and its contexts.
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private config: BrowserConfig;
  private sessions = new Map<string, BrowserContext>();

  constructor(config: BrowserConfig = {}) {
    this.config = config;
  }

  /**
   * Initializes the browser instance.
   */
  async init(): Promise<void> {
    if (this.browser) return;

    const launchOptions = {
      headless: this.config.headless ?? true,
      args: [...(this.config.args || [])],
      ignoreDefaultArgs: ['--enable-automation'],
      proxy: this.config.proxy
        ? {
            server: this.config.proxy.server,
            username: this.config.proxy.username,
            password: this.config.proxy.password,
          }
        : undefined,
    };

    // Basic anti-detection args if not explicitly provided
    if (!this.config.args) {
      launchOptions.args.push(
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-blink-features=AutomationControlled', // Important for anti-detection
      );
    }

    if (this.config.stealth) {
      // Add disable-http2 to avoid common fingerprinting (ERR_HTTP2_PROTOCOL_ERROR)
      launchOptions.args.push('--disable-http2');

      // Use playwright-extra with stealth plugin
      const launcher = enableStealth('chromium');
      this.browser = await launcher.launch(launchOptions);
    } else {
      // Use standard playwright
      this.browser = await chromium.launch(launchOptions);
    }
  }

  /**
   * Creates a new browser context with specific configuration.
   */
  async newContext(userAgent?: string): Promise<BrowserContext> {
    if (!this.browser) {
      await this.init();
    }

    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    const contextOptions: any = {
      viewport: this.config.viewport || { width: 1280, height: 800 },
      userAgent:
        userAgent ||
        this.config.userAgent ||
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (!this.browser) {
      throw new Error('Browser instance is not initialized');
    }
    const context = await this.browser.newContext(contextOptions);

    // Extra stealth scripts could be injected here if using playwright-extra/stealth

    return context;
  }

  /**
   * Gets an existing session context or creates a new one.
   */
  async getSessionContext(
    sessionId: string,
    userAgent?: string,
  ): Promise<BrowserContext> {
    if (this.sessions.has(sessionId)) {
      // biome-ignore lint/style/noNonNullAssertion: Checked with has()
      return this.sessions.get(sessionId)!;
    }

    const context = await this.newContext(userAgent);
    this.sessions.set(sessionId, context);
    return context;
  }

  /**
   * Closes a specific session context.
   */
  async closeSession(sessionId: string): Promise<void> {
    const context = this.sessions.get(sessionId);
    if (context) {
      await context.close();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Creates a new page in a new context.
   */
  async newPage(): Promise<{ page: Page; context: BrowserContext }> {
    const context = await this.newContext();
    const page = await context.newPage();
    return { page, context };
  }

  /**
   * Closes the browser instance.
   */
  async close(): Promise<void> {
    // Close all active sessions
    for (const context of Array.from(this.sessions.values())) {
      try {
        await context.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.sessions.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Checks if the browser is connected.
   */
  isConnected(): boolean {
    return this.browser?.isConnected() ?? false;
  }
}
