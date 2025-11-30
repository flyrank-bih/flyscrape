import type { AsyncWebCrawler } from './crawler';
import type { CrawlOptions, CrawlResult } from './types';

/**
 * Manages concurrent crawling tasks.
 */
export class Dispatcher {
  private crawler: AsyncWebCrawler;
  private concurrency: number;
  private active: number = 0;
  private queue: {
    url: string;
    options: Partial<CrawlOptions>;
    resolve: (value: CrawlResult) => void;
    // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    reject: (reason: any) => void;
  }[] = [];

  constructor(crawler: AsyncWebCrawler, concurrency: number = 5) {
    this.crawler = crawler;
    this.concurrency = concurrency;
  }

  /**
   * Adds a URL to the crawl queue.
   */
  async schedule(
    url: string,
    options: Partial<CrawlOptions> = {},
  ): Promise<CrawlResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this.process();
    });
  }

  /**
   * Processes the queue.
   */
  private async process() {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.active++;

    try {
      const result = await this.crawler.arun(task.url, task.options);
      task.resolve(result);
    } catch (error) {
      task.reject(error);
    } finally {
      this.active--;
      this.process();
    }
  }

  /**
   * Crawls multiple URLs in parallel.
   */
  async crawlMany(
    urls: string[],
    options: Partial<CrawlOptions> = {},
  ): Promise<CrawlResult[]> {
    const promises = urls.map((url) => this.schedule(url, options));
    return Promise.all(promises);
  }
}
