import type { Page } from 'playwright';
import type { CSSSchema, JsonSchema } from '../extraction/interfaces';
import type { PruningOptions } from '../processing/content-filter/interfaces';
import type { MarkdownGeneratorOptions } from '../processing/markdown/generator';

export interface BrowserConfig {
  headless?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
  args?: string[];
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  stealth?: boolean;
}

export interface CrawlerConfig {
  maxConcurrency?: number;
  cacheEnabled?: boolean;
  cacheSize?: number;
  cacheDir?: string;
  verbose?: boolean;
}

export interface CrawlOptions {
  url: string;
  waitForSelector?: string;
  waitDuration?: number;
  jsExecution?: boolean; // If false, use fetch/cheerio only (fast mode)
  magic?: boolean; // Enable anti-detection features
  screenshot?: boolean;
  headers?: Record<string, string>;
  bypassCache?: boolean;
  contentOnly?: boolean;
  excludeMedia?: boolean;
  optimizeWithAI?: boolean;
  openaiApiKey?: string;
  extraction?: {
    type: 'css' | 'llm';
    schema: CSSSchema | JsonSchema;
    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    provider?: any; // For LLM
  };
  processing?: {
    markdown?: MarkdownGeneratorOptions;
    pruning?: PruningOptions;
  };
  /**
   * Automatically scroll to the bottom of the page to load dynamic content.
   * Useful for infinite scroll pages.
   */
  autoScroll?: boolean;

  /**
   * Extract content from iframes and include it in the result.
   */
  extractIframes?: boolean;

  /**
   * Wait strategy for page load.
   * @default 'domcontentloaded'
   */
  waitMode?: 'networkidle' | 'domcontentloaded' | 'load';

  /**
   * Custom hooks to execute at various stages of the crawl.
   */
  hooks?: {
    onPageCreated?: (page: Page) => Promise<void>;
    onLoad?: (page: Page) => Promise<void>;
  };
}

export interface MediaResource {
  type: 'image' | 'video' | 'audio';
  src: string;
  alt?: string;
  srcset?: string;
  poster?: string;
  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  [key: string]: any;
}

export interface CrawlResult {
  url: string;
  html: string;
  markdown?: string;
  success: boolean;
  error?: string;
  statusCode?: number;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    publishedTime?: string;
    og?: Record<string, string>;
    twitter?: Record<string, string>;
    screenshot?: Buffer; // Base64 or Buffer
    executionTimeMs?: number;
  };
  links?: string[];
  media?: {
    images: MediaResource[];
    videos: MediaResource[];
    audio: MediaResource[];
  };
  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  extractedContent?: any;
  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  filteredContent?: any;
}

export type PageAction = (page: Page) => Promise<void>;
