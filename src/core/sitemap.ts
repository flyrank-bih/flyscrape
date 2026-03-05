import * as cheerio from 'cheerio';
import got from 'got';
import { URL } from 'node:url';
import { normalizeUrl } from '../utils/url';

/**
 * Options for fetching and parsing sitemaps.
 */
export interface SitemapOptions {
  /**
   * Request timeout in milliseconds.
   * @default 15_000
   */
  timeout?: number;

  /**
   * Maximum number of URLs to collect (stops after this many).
   * @default no limit
   */
  maxUrls?: number;

  /**
   * Maximum number of sitemap index files to follow (prevents runaway recursion).
   * @default 50
   */
  maxSitemaps?: number;

  /**
   * If true, only include URLs from the same origin as the sitemap.
   * @default true
   */
  sameOriginOnly?: boolean;

  /**
   * Custom headers (e.g. User-Agent) for sitemap requests.
   */
  headers?: Record<string, string>;

  /**
   * AbortSignal to cancel the operation.
   */
  signal?: AbortSignal;

  /**
   * Maximum number of redirects to follow.
   * @default 5
   */
  maxRedirects?: number;

  /**
   * If true and the root document is a sitemap index, the return value includes
   * a breakdown of child sitemaps by category (e.g. products, pages, blogs, collections).
   * @default false
   */
  includeSitemapCategories?: boolean;
}

/**
 * Category breakdown for a sitemap index (e.g. products, pages, blogs, collections).
 */
export interface SitemapCategoryInfo {
  count: number;
  urls: string[];
}

/**
 * Result of categorizing a sitemap index by type (products, pages, blogs, etc.).
 */
export interface SitemapIndexCategories {
  /** Category name -> count and list of sitemap URLs in that category */
  categories: Record<string, SitemapCategoryInfo>;
  /** Total number of child sitemaps in the index */
  totalSitemaps: number;
}

/**
 * Extracts a category label from a sitemap URL (e.g. sitemap_products_1.xml -> "products").
 * Matches common patterns: sitemap_<category>_N.xml or sitemap_<category>.xml.
 */
export function getSitemapCategoryFromUrl(sitemapUrl: string): string {
  try {
    const pathname = new URL(sitemapUrl).pathname;
    const match = pathname.match(/sitemap_([a-z0-9]+)(?:_\d+)?\.xml/i);
    return match ? match[1].toLowerCase() : 'other';
  } catch {
    return 'other';
  }
}

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_MAX_SITEMAPS = 50;
const DEFAULT_MAX_REDIRECTS = 5;

/**
 * Fetches a URL with secure defaults (HTTPS preferred, timeout, redirect limit).
 */
async function fetchXml(
  url: string,
  options: {
    timeout: number;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    maxRedirects: number;
  },
): Promise<string> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`Sitemap URL must use HTTP or HTTPS: ${url}`);
  }

  const response = await got(url, {
    timeout: { request: options.timeout },
    followRedirect: true,
    maxRedirects: options.maxRedirects,
    headers: {
      'User-Agent':
        options.headers?.['User-Agent'] ??
        'Mozilla/5.0 (compatible; FlyScrape-Sitemap/1.0)',
      Accept: 'application/xml, text/xml, */*',
      ...options.headers,
    },
    signal: options.signal,
    https: { rejectUnauthorized: true },
  });

  return response.body;
}

/**
 * Parses sitemap XML and returns either page URLs or child sitemap URLs.
 * Exported for testing.
 */
export function parseSitemapXml(
  xml: string,
  baseUrl: string,
): { type: 'urlset'; urls: string[] } | { type: 'sitemapindex'; urls: string[] } {
  const $ = cheerio.load(xml, { xml: true });

  // Sitemaps may use default namespace; select with namespace or local name
  const locs = $('loc');
  const urls: string[] = [];

  locs.each((_, el) => {
    const text = $(el).text().trim();
    if (text) urls.push(text);
  });

  // If we have sitemap > loc, it's a sitemap index; if url > loc, it's urlset
  const sitemapLocs = $('sitemap loc');
  const urlLocs = $('url loc');

  if (sitemapLocs.length > 0) {
    const list: string[] = [];
    sitemapLocs.each((_, el) => {
      const text = $(el).text().trim();
      if (text) list.push(text);
    });
    return { type: 'sitemapindex', urls: list };
  }

  if (urlLocs.length > 0) {
    const list: string[] = [];
    urlLocs.each((_, el) => {
      const text = $(el).text().trim();
      if (text) list.push(text);
    });
    return { type: 'urlset', urls: list };
  }

  // Fallback: any <loc> (some sitemaps omit namespace or use different structure)
  if (urls.length > 0) {
    // Heuristic: if any URL ends with common sitemap patterns, treat as index
    const looksLikeIndex = urls.some(
      (u) =>
        /\.xml(?:\?|$)/.test(u) ||
        u.toLowerCase().includes('sitemap'),
    );
    return looksLikeIndex
      ? { type: 'sitemapindex', urls }
      : { type: 'urlset', urls };
  }

  return { type: 'urlset', urls: [] };
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

/**
 * Fetches a sitemap index URL (one request only) and returns categorized counts
 * of child sitemaps, e.g. { products: { count: 6, urls: [...] }, pages: { count: 6, urls: [...] }, ... }.
 * Use this to get a breakdown like "products (6), pages (6), blogs (12), collections (6)" without
 * following into each child sitemap.
 */
export async function getSitemapIndexCategories(
  sitemapIndexUrl: string,
  options: Pick<SitemapOptions, 'timeout' | 'headers' | 'signal' | 'maxRedirects'> = {},
): Promise<SitemapIndexCategories> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  const xml = await fetchXml(sitemapIndexUrl, {
    timeout,
    headers: options.headers,
    signal: options.signal,
    maxRedirects,
  });

  const base = sitemapIndexUrl.replace(/\/[^/]*$/, '/');
  const parsed = parseSitemapXml(xml, base);

  if (parsed.type !== 'sitemapindex') {
    return { categories: {}, totalSitemaps: 0 };
  }

  const categories: Record<string, SitemapCategoryInfo> = {};
  for (const u of parsed.urls) {
    const resolved = resolveUrl(u, base);
    const category = getSitemapCategoryFromUrl(resolved);
    if (!categories[category]) {
      categories[category] = { count: 0, urls: [] };
    }
    categories[category].count += 1;
    categories[category].urls.push(resolved);
  }

  return {
    categories,
    totalSitemaps: parsed.urls.length,
  };
}

export type FetchSitemapUrlsResult =
  | string[]
  | { urls: string[]; sitemapCategories: SitemapIndexCategories };

/**
 * Recursively fetches sitemap(s) and collects all page URLs.
 * Handles sitemap index files and deduplicates by normalized URL.
 * When includeSitemapCategories is true and the root is a sitemap index, returns
 * { urls, sitemapCategories } with a per-category count (e.g. products, pages, blogs, collections).
 */
export async function fetchSitemapUrls(
  sitemapUrl: string,
  options: SitemapOptions = {},
): Promise<FetchSitemapUrlsResult> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const maxUrls = options.maxUrls ?? Number.POSITIVE_INFINITY;
  const maxSitemaps = options.maxSitemaps ?? DEFAULT_MAX_SITEMAPS;
  const sameOriginOnly = options.sameOriginOnly ?? true;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const includeSitemapCategories = options.includeSitemapCategories ?? false;

  const baseParsed = new URL(sitemapUrl);
  const origin = baseParsed.origin;
  const seen = new Set<string>();
  const collected: string[] = [];
  let sitemapsFetched = 0;
  let rootCategories: SitemapIndexCategories | undefined;

  function isSameOrigin(href: string): boolean {
    try {
      return new URL(href).origin === origin;
    } catch {
      return false;
    }
  }

  function addUrl(url: string): void {
    const resolved = resolveUrl(url, sitemapUrl);
    const normalized = normalizeUrl(resolved);
    if (sameOriginOnly && !isSameOrigin(resolved)) return;
    if (seen.has(normalized)) return;
    if (collected.length >= maxUrls) return;
    seen.add(normalized);
    collected.push(resolved);
  }

  const queue: string[] = [sitemapUrl];

  while (queue.length > 0 && collected.length < maxUrls && sitemapsFetched < maxSitemaps) {
    const current = queue.shift()!;
    const isRoot = sitemapsFetched === 0;
    sitemapsFetched++;

    const xml = await fetchXml(current, {
      timeout,
      headers: options.headers,
      signal: options.signal,
      maxRedirects,
    });

    const base = current.replace(/\/[^/]*$/, '/');
    const parsed = parseSitemapXml(xml, base);

    if (parsed.type === 'sitemapindex') {
      if (includeSitemapCategories && isRoot) {
        const categories: Record<string, SitemapCategoryInfo> = {};
        for (const u of parsed.urls) {
          const resolved = resolveUrl(u, base);
          const category = getSitemapCategoryFromUrl(resolved);
          if (!categories[category]) {
            categories[category] = { count: 0, urls: [] };
          }
          categories[category].count += 1;
          categories[category].urls.push(resolved);
        }
        rootCategories = { categories, totalSitemaps: parsed.urls.length };
      }
      for (const u of parsed.urls) {
        if (sitemapsFetched + queue.length >= maxSitemaps) break;
        const resolved = resolveUrl(u, base);
        if (sameOriginOnly && !isSameOrigin(resolved)) continue;
        queue.push(resolved);
      }
    } else {
      for (const u of parsed.urls) {
        addUrl(u);
        if (collected.length >= maxUrls) break;
      }
    }
  }

  if (includeSitemapCategories && rootCategories) {
    return { urls: collected, sitemapCategories: rootCategories };
  }
  return collected;
}
