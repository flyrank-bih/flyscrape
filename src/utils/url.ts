import { URL } from 'node:url';

/**
 * Configuration options for URL normalization.
 */
export interface NormalizeUrlOptions {
  /**
   * Whether to strip the hash/fragment from the URL.
   * @default true
   */
  stripHash?: boolean;

  /**
   * Whether to strip 'www.' from the hostname.
   * @default false
   */
  stripWWW?: boolean;

  /**
   * List of regex patterns for query parameters to remove.
   * Defaults to common analytics parameters (utm_*, fbclid, etc).
   */
  removeQueryParameters?: RegExp[];

  /**
   * Whether to sort query parameters alphabetically.
   * @default true
   */
  sortQueryParameters?: boolean;
}

const DEFAULT_REMOVE_PARAMS = [
  /^utm_/,
  /^fbclid$/,
  /^gclid$/,
  /^ref$/,
  /^msclkid$/,
  /^mc_eid$/,
];

/**
 * Normalizes a URL by cleaning parameters, sorting them, and standardizing format.
 * Follows crawl4ai's URL processing logic.
 * @param url The URL to normalize.
 * @param options Normalization options.
 * @returns The normalized URL string.
 */
export function normalizeUrl(
  url: string,
  options: NormalizeUrlOptions = {},
): string {
  if (!url) return '';

  try {
    // handle relative URLs if possible, but usually we expect full URLs here.
    // If it's a path, we might return as is or try to handle?
    // For safety, if it fails to parse, return original.
    const urlObj = new URL(url);

    // 1. Lowercase scheme and host (URL class does this automatically)

    // 2. Strip hash/fragment
    if (options.stripHash !== false) {
      urlObj.hash = '';
    }

    // 3. Sort and Filter Query Parameters
    const params = new URLSearchParams(urlObj.search);
    const sortedParams = new URLSearchParams();

    const keys = Array.from(params.keys()).sort();
    const removePatterns =
      options.removeQueryParameters || DEFAULT_REMOVE_PARAMS;

    for (const key of keys) {
      let keep = true;
      for (const pattern of removePatterns) {
        if (pattern.test(key)) {
          keep = false;
          break;
        }
      }

      if (keep) {
        const values = params.getAll(key);
        // Sort values for determinism
        values.sort();
        values.forEach((v) => {
          sortedParams.append(key, v);
        });
      }
    }

    // Only set search if we have params, to avoid trailing '?' if empty?
    // URLSearchParams.toString() returns empty string if no params.
    urlObj.search = sortedParams.toString();

    // 4. Strip WWW (optional)
    if (options.stripWWW && urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.substring(4);
    }

    // 5. Remove trailing slash?
    // crawl4ai doesn't explicitly mandate this in the summary, but it's common.
    // Let's keep it standard: standard URL usually has / if path is empty.
    // If path is /foo/, it stays /foo/.

    return urlObj.toString();
  } catch (_) {
    // Not a valid URL (maybe a relative path or file path)
    return url;
  }
}

/**
 * Checks if a URL is likely a sitemap.
 * @param url The URL to check.
 * @returns True if it looks like a sitemap.
 */
export function isSitemap(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return pathname.endsWith('.xml') || pathname.endsWith('sitemap');
  } catch {
    // If not a full URL, check string end
    return url.toLowerCase().endsWith('.xml');
  }
}

/**
 * Checks if a URL is a local file path.
 * @param url The URL or path to check.
 * @returns True if it is a local file.
 */
export function isLocalFile(url: string): boolean {
  if (url.startsWith('file://')) return true;

  // Unix absolute path
  if (url.startsWith('/')) return true;

  // Windows absolute path (e.g. C:\...)
  if (/^[a-zA-Z]:\\/.test(url)) return true;

  return false;
}

/**
 * Checks if a target URL is external relative to a base URL.
 * @param url The target URL.
 * @param baseUrl The base URL (current page).
 * @returns True if external (different domain).
 */
export function isExternalUrl(url: string, baseUrl: string): boolean {
  try {
    const target = new URL(url, baseUrl); // Handle relative URLs
    const base = new URL(baseUrl);

    // Compare hostnames
    return target.hostname !== base.hostname;
  } catch {
    return false;
  }
}
