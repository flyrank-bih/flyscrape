import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AsyncWebCrawler } from '../crawler';

// Note: These tests require internet connection and may be slow.
// In a CI environment, we might want to mock the browser or network.
// For this implementation, we assume local execution.

describe('AsyncWebCrawler', () => {
  let crawler: AsyncWebCrawler;

  beforeAll(async () => {
    crawler = new AsyncWebCrawler();
    await crawler.start();
  });

  afterAll(async () => {
    await crawler.close();
  });

  it('should crawl a simple page (fetch mode)', async () => {
    const result = await crawler.arun('https://example.com', {
      jsExecution: false,
    });

    expect(result.success).toBe(true);
    expect(result.html).toContain('Example Domain');
    expect(result.metadata?.title).toContain('Example Domain');
  }, 10000);

  it('should crawl a simple page (browser mode)', async () => {
    const result = await crawler.arun('https://example.com', {
      jsExecution: true,
    });

    expect(result.success).toBe(true);
    expect(result.html).toContain('Example Domain');
    expect(result.metadata?.title).toContain('Example Domain');
    expect(result.metadata?.screenshot).toBeUndefined(); // Not requested
  }, 30000);

  it('should take a screenshot', async () => {
    const result = await crawler.arun('https://example.com', {
      jsExecution: true,
      screenshot: true,
      bypassCache: true,
    });

    expect(result.success).toBe(true);
    expect(result.metadata?.screenshot).toBeDefined();
  }, 30000);

  it('should handle 404s', async () => {
    const result = await crawler.arun('https://httpbin.org/status/404');
    // Note: Playwright might not throw on 404, but return the page.
    // The status code should be 404.

    expect(result.statusCode).toBe(404);
  }, 30000);

  it('should extract links', async () => {
    const result = await crawler.arun('https://example.com');
    expect(result.links).toBeDefined();
    expect(result.links?.length).toBeGreaterThan(0);
    expect(result.links?.[0]).toContain('iana.org');
  }, 30000);

  it('should generate markdown', async () => {
    const result = await crawler.arun('https://example.com');
    expect(result.markdown).toBeDefined();
    expect(result.markdown).toContain('Example Domain');
  }, 30000);
});
