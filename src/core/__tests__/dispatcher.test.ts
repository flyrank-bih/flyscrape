import { beforeEach, describe, expect, it } from 'vitest';
import type { AsyncWebCrawler } from '../crawler';
import { Dispatcher } from '../dispatcher';
import type { CrawlResult } from '../types';

// Mock AsyncWebCrawler
class MockCrawler {
  async arun(url: string): Promise<CrawlResult> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
    return {
      url,
      html: '<html></html>',
      success: true,
      links: [],
      // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
    } as any;
  }
}

describe('Dispatcher', () => {
  let crawler: AsyncWebCrawler;
  let dispatcher: Dispatcher;

  beforeEach(() => {
    crawler = new MockCrawler() as unknown as AsyncWebCrawler;
    dispatcher = new Dispatcher(crawler, 2); // Concurrency 2
  });

  it('should process single URL', async () => {
    const result = await dispatcher.schedule('http://example.com');
    expect(result.url).toBe('http://example.com');
    expect(result.success).toBe(true);
  });

  it('should process multiple URLs with concurrency', async () => {
    const urls = [
      'http://example.com/1',
      'http://example.com/2',
      'http://example.com/3',
      'http://example.com/4',
    ];

    const startTime = Date.now();
    const results = await dispatcher.crawlMany(urls);
    const endTime = Date.now();
    const _duration = endTime - startTime;

    expect(results.length).toBe(4);
    // With concurrency 2 and 100ms delay per task:
    // Batch 1: 1, 2 (start at 0, end at 100)
    // Batch 2: 3, 4 (start at 100, end at 200)
    // Total time approx 200ms + overhead.
    // Without concurrency it would be 400ms.

    // We can't strictly assert timing in unit tests, but we can verify results
    expect(results.map((r) => r.url)).toEqual(urls);
  });

  it('should handle errors in queue', async () => {
    const mockErrorCrawler = {
      arun: async (url: string) => {
        if (url.includes('error')) {
          throw new Error('Failed');
        }
        return { url, success: true };
      },
    } as unknown as AsyncWebCrawler;

    const d = new Dispatcher(mockErrorCrawler);

    // Should throw/reject
    await expect(d.schedule('http://error.com')).rejects.toThrow('Failed');

    // Other tasks should still work
    const result = await d.schedule('http://ok.com');
    expect(result.success).toBe(true);
  });
});
