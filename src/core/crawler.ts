import * as cheerio from "cheerio";
import { CacheManager } from "../cache";
import {
  DEFAULT_BROWSER_CONFIG,
  DEFAULT_CRAWLER_CONFIG,
} from "../config/defaults";
import { mergeBrowserConfig, mergeCrawlerConfig } from "../config/schemas";
import { extractWithCss } from "../extraction/css-strategy";
import type {
  CSSSchema,
  JsonSchema,
  LLMProvider,
} from "../extraction/interfaces";
import { extractWithLlm } from "../extraction/llm-strategy";
import { regexChunk } from "../processing/chunking/regex";
import { pruneContent } from "../processing/content-filter/pruning";
import { generateMarkdown } from "../processing/markdown/generator";
import { BrowserManager } from "./browser-manager";
import { Dispatcher } from "./dispatcher";
import type {
  BrowserConfig,
  CrawlerConfig,
  CrawlOptions,
  CrawlResult,
  PageAction,
} from "./types";

/**
 * The main crawler class.
 */
export class AsyncWebCrawler {
  private browserManager: BrowserManager;
  private config: CrawlerConfig;
  private cacheManager: CacheManager | undefined;

  constructor(
    browserConfig: Partial<BrowserConfig> = {},
    crawlerConfig: Partial<CrawlerConfig> = {}
  ) {
    const finalBrowserConfig = mergeBrowserConfig(
      DEFAULT_BROWSER_CONFIG,
      browserConfig
    );
    this.config = mergeCrawlerConfig(DEFAULT_CRAWLER_CONFIG, crawlerConfig);

    this.browserManager = new BrowserManager(finalBrowserConfig);

    if (this.config.cacheEnabled) {
      this.cacheManager = new CacheManager(this.config.cacheSize);
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
    options: Partial<CrawlOptions> = {}
  ): Promise<CrawlResult> {
    const fullOptions: CrawlOptions = {
      url,
      jsExecution: true,
      waitDuration: 1000,
      ...options,
    };

    // Check cache if enabled and no bypass requested
    if (
      this.config.cacheEnabled &&
      this.cacheManager &&
      !fullOptions.bypassCache
    ) {
      const cached = this.cacheManager.get(url);
      if (cached) {
        return cached;
      }
    }

    const startTime = Date.now();
    let result: CrawlResult;

    try {
      if (fullOptions.jsExecution) {
        result = await this.crawlWithBrowser(fullOptions, startTime);
      } else {
        result = await this.crawlWithFetch(fullOptions, startTime);
      }
      // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    } catch (error: any) {
      result = {
        url,
        html: "",
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
      !fullOptions.bypassCache
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
    options: Partial<CrawlOptions> = {}
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
   * Internal method to crawl using Playwright.
   */
  private async crawlWithBrowser(
    options: CrawlOptions,
    startTime: number
  ): Promise<CrawlResult> {
    const { page, context } = await this.browserManager.newPage();

    try {
      // Set extra headers if provided
      if (options.headers) {
        await page.setExtraHTTPHeaders(options.headers);
      }

      // Navigate
      const response = await page.goto(options.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const statusCode = response?.status();

      // Wait strategies
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      } else if (options.waitDuration) {
        await page.waitForTimeout(options.waitDuration);
      }

      // Handle "magic" (anti-detection interactions)
      if (options.magic) {
        await this.performMagic(page);
      }

      // Extract content
      const content = await page.content();
      const title = await page.title();

      // Screenshot if requested
      let screenshot: Buffer | undefined;
      if (options.screenshot) {
        screenshot = await page.screenshot({ fullPage: true });
      }

      // Extract links
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a"))
          .map((a) => a.href)
          .filter((href) => href.startsWith("http"));
      });

      // Generate Markdown
      const markdownResult = generateMarkdown(
        content,
        options.processing?.markdown
      );
      let markdown =
        markdownResult.markdownWithCitations || markdownResult.rawMarkdown;

      if (markdownResult.referencesMarkdown) {
        markdown += `\n\n${markdownResult.referencesMarkdown}`;
      }

      // Get meta description and keywords
      const metadata = await page.evaluate(() => {
        const desc = document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content");
        const keys = document
          .querySelector('meta[name="keywords"]')
          ?.getAttribute("content");
        return { description: desc || undefined, keywords: keys || undefined };
      });

      // Handle Extraction
      // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
      let extractedContent: any;
      if (options.extraction) {
        if (options.extraction.type === "css") {
          extractedContent = extractWithCss(
            content,
            options.extraction.schema as CSSSchema
          );
        } else if (
          options.extraction.type === "llm" &&
          options.extraction.provider
        ) {
          const extractionResult = await extractWithLlm(
            markdown, // Use markdown for LLM to save tokens
            options.extraction.schema as JsonSchema,
            options.extraction.provider as LLMProvider
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
        url: options.url,
        html: content,
        markdown,
        success: true,
        statusCode,
        links,
        extractedContent,
        filteredContent,
        metadata: {
          title,
          description: metadata.description,
          keywords: metadata.keywords,
          screenshot,
          executionTimeMs: Date.now() - startTime,
        },
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Internal method to crawl using simple fetch (faster, no JS).
   */
  private async crawlWithFetch(
    options: CrawlOptions,
    startTime: number
  ): Promise<CrawlResult> {
    const response = await fetch(options.url, {
      headers: options.headers,
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content");
    const keywords = $('meta[name="keywords"]').attr("content");

    const links: string[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href?.startsWith("http")) {
        links.push(href);
      }
    });

    // Generate Markdown
    const markdownResult = generateMarkdown(html, options.processing?.markdown);
    let markdown =
      markdownResult.markdownWithCitations || markdownResult.rawMarkdown;

    if (markdownResult.referencesMarkdown) {
      markdown += `\n\n${markdownResult.referencesMarkdown}`;
    }

    // Handle Extraction
    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    let extractedContent: any;
    if (options.extraction) {
      if (options.extraction.type === "css") {
        extractedContent = extractWithCss(
          html,
          options.extraction.schema as CSSSchema
        );
      } else if (
        options.extraction.type === "llm" &&
        options.extraction.provider
      ) {
        const extractionResult = await extractWithLlm(
          markdown, // Use markdown for LLM to save tokens
          options.extraction.schema as JsonSchema,
          options.extraction.provider as LLMProvider
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
      url: options.url,
      html,
      markdown,
      success: response.ok,
      statusCode: response.status,
      links,
      extractedContent,
      filteredContent,
      metadata: {
        title,
        description,
        keywords,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Simulates human behavior to avoid detection.
   */

  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  private async performMagic(page: any): Promise<void> {
    // Random mouse movements
    await page.mouse.move(Math.random() * 100, Math.random() * 100);
    await page.waitForTimeout(Math.random() * 500 + 200);

    // Scroll down a bit
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight / 2);
    });
    await page.waitForTimeout(Math.random() * 500 + 200);
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
}
