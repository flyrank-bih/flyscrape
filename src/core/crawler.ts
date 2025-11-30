import * as fs from 'node:fs/promises';
import { CacheManager } from '../cache';
import {
  DEFAULT_BROWSER_CONFIG,
  DEFAULT_CRAWLER_CONFIG,
} from '../config/defaults';
import { mergeBrowserConfig, mergeCrawlerConfig } from '../config/schemas';
import { extractWithCss } from '../extraction/css-strategy';
import type {
  CSSSchema,
  JsonSchema,
  LLMProvider,
} from '../extraction/interfaces';
import { extractWithLlm } from '../extraction/llm-strategy';
import { regexChunk } from '../processing/chunking/regex';
import { pruneContent } from '../processing/content-filter/pruning';
import { smartClean } from '../processing/content-filter/smart-cleaner';
import { generateMarkdown } from '../processing/markdown/generator';
import { performStealthActions } from '../stealth/actions';
import { isBlocked } from '../stealth/detector';
import { extractLinks, extractMedia, extractMetadata } from '../utils/dom';
import { normalizeUrl } from '../utils/url';
import { BrowserManager } from './browser-manager';
import { Dispatcher } from './dispatcher';
import type {
  BrowserConfig,
  CrawlerConfig,
  CrawlOptions,
  CrawlResult,
  PageAction,
} from './types';

/**
 * The main crawler class.
 */
export class AsyncWebCrawler {
  private browserManager: BrowserManager;
  private config: CrawlerConfig;
  private cacheManager: CacheManager | undefined;

  constructor(
    browserConfig: Partial<BrowserConfig> = {},
    crawlerConfig: Partial<CrawlerConfig> = {},
  ) {
    const finalBrowserConfig = mergeBrowserConfig(
      DEFAULT_BROWSER_CONFIG,
      browserConfig,
    );
    this.config = mergeCrawlerConfig(DEFAULT_CRAWLER_CONFIG, crawlerConfig);

    this.browserManager = new BrowserManager(finalBrowserConfig);

    if (this.config.cacheEnabled) {
      this.cacheManager = new CacheManager(
        this.config.cacheSize,
        this.config.cacheDir,
      );
    }
  }

  /**
   * Initializes the crawler (launches browser).
   */
  async start(): Promise<void> {
    await this.browserManager.init();
  }

  /**
   * Closes the crawler and releases resources.
   */
  async close(): Promise<void> {
    await this.browserManager.close();
  }

  /**
   * Crawls a single URL.
   */
  async arun(
    url: string,
    options: Partial<CrawlOptions> = {},
  ): Promise<CrawlResult> {
    // Normalize URL to ensure consistency
    let normalizedUrl = url;
    if (!url.startsWith('raw:') && !url.startsWith('file://')) {
      normalizedUrl = normalizeUrl(url);
    }

    const fullOptions: CrawlOptions = {
      url: normalizedUrl,
      jsExecution: true,
      waitDuration: 1000,
      ...options,
    };

    // Check cache if enabled and no bypass requested
    if (
      this.config.cacheEnabled &&
      this.cacheManager &&
      !fullOptions.bypassCache &&
      !normalizedUrl.startsWith('raw:') // Don't cache raw content
    ) {
      const cached = this.cacheManager.get(normalizedUrl);
      if (cached) {
        return cached;
      }
    }

    const startTime = Date.now();
    let result: CrawlResult;

    try {
      if (
        fullOptions.url.startsWith('raw:') ||
        fullOptions.url.startsWith('file://')
      ) {
        // Use fetch strategy for raw/file (it handles them now)
        result = await this.crawlWithFetch(fullOptions, startTime);
      } else if (fullOptions.jsExecution) {
        result = await this.crawlWithBrowser(fullOptions, startTime);
      } else {
        result = await this.crawlWithFetch(fullOptions, startTime);
      }
      // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    } catch (error: any) {
      result = {
        url,
        html: '',
        success: false,
        error: error.message,
        metadata: { executionTimeMs: Date.now() - startTime },
      };
    }

    // Cache the result if successful and caching is enabled
    if (
      this.config.cacheEnabled &&
      this.cacheManager &&
      result.success &&
      !fullOptions.bypassCache &&
      !normalizedUrl.startsWith('raw:')
    ) {
      this.cacheManager.set(url, result);
    }

    return result;
  }

  /**
   * Crawls multiple URLs in parallel using the configured concurrency.
   */
  async arunMany(
    urls: string[],
    options: Partial<CrawlOptions> = {},
  ): Promise<CrawlResult[]> {
    const dispatcher = new Dispatcher(this, this.config.maxConcurrency);
    return await dispatcher.crawlMany(urls, options);
  }

  /**
   * Clears the result cache.
   */
  clearCache(): void {
    if (this.cacheManager) {
      this.cacheManager.clear();
    }
  }

  /**
   * Shared processing logic for both browser and fetch strategies.
   */
  private async processPageContent(
    html: string,
    url: string,
    options: CrawlOptions,
    startTime: number,
    screenshot?: Buffer,
  ): Promise<CrawlResult> {
    // Check for blocking
    if (isBlocked(html)) {
      throw new Error(
        'Request blocked by anti-bot system (Captcha/WAF detected).',
      );
    }

    // Extract links
    const allLinks = extractLinks(html);
    const links = allLinks.filter((href) => href.startsWith('http'));

    // Process content if contentOnly is requested
    let processedHtml = html;
    if (options.contentOnly) {
      processedHtml = await smartClean(html, {
        excludeMedia: options.excludeMedia,
        optimizeWithAI: options.optimizeWithAI,
        openaiApiKey: options.openaiApiKey,
      });
    }

    // Generate Markdown
    const markdownResult = generateMarkdown(
      processedHtml,
      options.processing?.markdown,
    );
    let markdown =
      markdownResult.markdownWithCitations || markdownResult.rawMarkdown;

    if (markdownResult.referencesMarkdown) {
      markdown += `\n\n${markdownResult.referencesMarkdown}`;
    }

    // Extract Metadata & Media
    const metadata = extractMetadata(html);
    const media = extractMedia(html);

    // Handle Extraction
    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    let extractedContent: any;
    if (options.extraction) {
      if (options.extraction.type === 'css') {
        extractedContent = extractWithCss(
          processedHtml,
          options.extraction.schema as CSSSchema,
        );
      } else if (
        options.extraction.type === 'llm' &&
        options.extraction.provider
      ) {
        const extractionResult = await extractWithLlm(
          markdown, // Use markdown for LLM to save tokens
          options.extraction.schema as JsonSchema,
          options.extraction.provider as LLMProvider,
        );
        extractedContent = extractionResult.data;
      }
    }

    // Handle Pruning
    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    let filteredContent: any;
    if (options.processing?.pruning) {
      const chunks = regexChunk(markdown);
      filteredContent = pruneContent(chunks, options.processing.pruning);
    }

    return {
      url,
      html: processedHtml,
      markdown,
      success: true,
      links,
      media,
      extractedContent,
      filteredContent,
      metadata: {
        ...metadata,
        screenshot,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Internal method to crawl using Playwright.
   */
  private async crawlWithBrowser(
    options: CrawlOptions,
    startTime: number,
  ): Promise<CrawlResult> {
    const { page, context } = await this.browserManager.newPage();

    try {
      // Hook: onPageCreated
      if (options.hooks?.onPageCreated) {
        await options.hooks.onPageCreated(page);
      }

      // Set extra headers if provided
      if (options.headers) {
        await page.setExtraHTTPHeaders(options.headers);
      }

      // Navigate
      const response = await page.goto(options.url, {
        waitUntil: options.waitMode || 'domcontentloaded',
        timeout: 30000,
      });

      const statusCode = response?.status();

      // Hook: onLoad
      if (options.hooks?.onLoad) {
        await options.hooks.onLoad(page);
      }

      // Wait strategies
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      } else if (options.waitDuration) {
        await page.waitForTimeout(options.waitDuration);
      }

      // Handle "magic" (anti-detection interactions)
      if (options.magic) {
        await performStealthActions(page);
      }

      // Auto Scroll
      if (options.autoScroll) {
        await this.autoScroll(page);
      }

      // Extract content
      let content = await page.content();

      // Extract Iframe Content
      if (options.extractIframes) {
        const frames = page.frames();
        for (const frame of frames) {
          if (frame === page.mainFrame()) continue;
          try {
            const frameContent = await frame.content();
            const frameUrl = frame.url();
            content += `\n<!-- Iframe: ${frameUrl} -->\n<div data-iframe-source="${frameUrl}">${frameContent}</div>`;
          } catch (_) {
            // Ignore cross-origin errors
          }
        }
      }

      // Screenshot if requested
      let screenshot: Buffer | undefined;
      if (options.screenshot) {
        screenshot = await page.screenshot({ fullPage: true });
      }

      const result = await this.processPageContent(
        content,
        options.url,
        options,
        startTime,
        screenshot,
      );

      return { ...result, statusCode };
    } finally {
      await context.close();
    }
  }

  /**
   * Internal method to crawl using simple fetch (faster, no JS).
   */
  private async crawlWithFetch(
    options: CrawlOptions,
    startTime: number,
  ): Promise<CrawlResult> {
    let html = '';
    let statusCode = 200;

    if (options.url.startsWith('raw:')) {
      html = options.url.slice(4);
    } else if (options.url.startsWith('file://')) {
      const path = options.url.slice(7);
      html = await fs.readFile(path, 'utf-8');
    } else {
      const response = await fetch(options.url, {
        headers: options.headers,
      });
      html = await response.text();
      statusCode = response.status;
    }

    const result = await this.processPageContent(
      html,
      options.url,
      options,
      startTime,
    );

    return { ...result, statusCode };
  }

  /**
   * Executes a custom action on a page.
   */
  async executeAction(url: string, action: PageAction): Promise<void> {
    const { page, context } = await this.browserManager.newPage();
    try {
      await page.goto(url);
      await action(page);
    } finally {
      await context.close();
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  private async autoScroll(page: any): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
