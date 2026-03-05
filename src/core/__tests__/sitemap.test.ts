import { describe, expect, it } from 'vitest';
import {
  fetchSitemapUrls,
  getSitemapCategoryFromUrl,
  parseSitemapXml,
} from '../sitemap';

const urlsetXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page1</loc></url>
  <url><loc>https://example.com/page2</loc></url>
  <url><loc>https://example.com/page3</loc></url>
</urlset>`;

const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-a.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-b.xml</loc></sitemap>
</sitemapindex>`;

describe('parseSitemapXml', () => {
  it('should parse urlset and return page URLs', () => {
    const result = parseSitemapXml(urlsetXml, 'https://example.com/');
    expect(result.type).toBe('urlset');
    expect(result.urls).toHaveLength(3);
    expect(result.urls).toContain('https://example.com/page1');
    expect(result.urls).toContain('https://example.com/page2');
    expect(result.urls).toContain('https://example.com/page3');
  });

  it('should parse sitemap index and return child sitemap URLs', () => {
    const result = parseSitemapXml(sitemapIndexXml, 'https://example.com/');
    expect(result.type).toBe('sitemapindex');
    expect(result.urls).toHaveLength(2);
    expect(result.urls).toContain('https://example.com/sitemap-a.xml');
    expect(result.urls).toContain('https://example.com/sitemap-b.xml');
  });
});

describe('fetchSitemapUrls', () => {
  it('should reject non-HTTP(S) sitemap URL', async () => {
    await expect(
      fetchSitemapUrls('file:///tmp/sitemap.xml'),
    ).rejects.toThrow(/HTTP or HTTPS/);
  });

  it('should reject non-HTTP protocol (e.g. ftp)', async () => {
    await expect(
      fetchSitemapUrls('ftp://example.com/sitemap.xml'),
    ).rejects.toThrow(/HTTP or HTTPS/);
  });
});

describe('getSitemapCategoryFromUrl', () => {
  it('should extract category from sitemap_<category>_N.xml', () => {
    expect(
      getSitemapCategoryFromUrl(
        'https://www.flyrank.com/sitemap_products_1.xml?from=1&to=2',
      ),
    ).toBe('products');
    expect(
      getSitemapCategoryFromUrl(
        'https://www.flyrank.com/sitemap_pages_1.xml?from=1&to=2',
      ),
    ).toBe('pages');
    expect(
      getSitemapCategoryFromUrl(
        'https://www.flyrank.com/sitemap_collections_1.xml?from=1&to=2',
      ),
    ).toBe('collections');
    expect(
      getSitemapCategoryFromUrl('https://www.flyrank.com/sitemap_blogs_1.xml'),
    ).toBe('blogs');
    expect(
      getSitemapCategoryFromUrl('https://www.flyrank.com/sitemap_blogs_2.xml'),
    ).toBe('blogs');
  });

  it('should handle path with locale prefix', () => {
    expect(
      getSitemapCategoryFromUrl(
        'https://www.flyrank.com/en-uk/sitemap_products_1.xml?from=1&to=2',
      ),
    ).toBe('products');
    expect(
      getSitemapCategoryFromUrl(
        'https://www.flyrank.com/en-eu/sitemap_blogs_2.xml',
      ),
    ).toBe('blogs');
  });

  it('should return "other" for URLs without sitemap_<name>_N.xml pattern', () => {
    expect(getSitemapCategoryFromUrl('https://example.com/sitemap-a.xml')).toBe(
      'other',
    );
    expect(getSitemapCategoryFromUrl('https://example.com/feed.xml')).toBe(
      'other',
    );
  });
});
