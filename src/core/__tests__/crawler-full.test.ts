import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AsyncWebCrawler } from '../crawler';

describe('AsyncWebCrawler Full Integration', () => {
  let crawler: AsyncWebCrawler;

  beforeAll(async () => {
    crawler = new AsyncWebCrawler(
      { headless: true }, 
      { cacheEnabled: true, maxConcurrency: 2 }
    );
    await crawler.start();
  });

  afterAll(async () => {
    await crawler.close();
  });

  it('should cache results in fetch mode', async () => {
    const url = 'https://example.com';
    // Use a unique URL or clear cache to ensure clean state if needed, 
    // but this is the first test using this url in this suite.
    
    const fetchSpy = vi.spyOn(global, 'fetch');
    
    // First crawl
    const result1 = await crawler.arun(url, { jsExecution: false });
    expect(result1.success).toBe(true);
    
    const callsAfterFirst = fetchSpy.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Second crawl - should hit cache
    const result2 = await crawler.arun(url, { jsExecution: false });
    expect(result2.success).toBe(true);
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst); // No new calls

    // Third crawl with bypassCache
    const result3 = await crawler.arun(url, { jsExecution: false, bypassCache: true });
    expect(result3.success).toBe(true);
    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst + 1); // One new call

    fetchSpy.mockRestore();
  });

  it('should clear cache', async () => {
    const url = 'https://iana.org'; // Different URL
    const fetchSpy = vi.spyOn(global, 'fetch');
    
    await crawler.arun(url, { jsExecution: false });
    const callsAfterFirst = fetchSpy.mock.calls.length;
    
    crawler.clearCache();
    
    await crawler.arun(url, { jsExecution: false });
    // Should trigger fetch again because cache was cleared
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    
    fetchSpy.mockRestore();
  });

  it('should crawl many URLs', async () => {
    const urls = [
      'https://example.com',
      'https://example.org',
      'https://example.net'
    ];
    
    // We use fetch mode for speed
    const results = await crawler.arunMany(urls, { jsExecution: false });
    
    expect(results).toHaveLength(3);
    results.forEach(r => {
      expect(r.success).toBe(true);
      expect(r.html).toBeDefined();
    });
  });
});
