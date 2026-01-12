import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { CrawlResult } from '../core/types';
import { SimpleCache } from '../utils/cache';
import { normalizeUrl } from '../utils/url';

/**
 * Hybrid cache (Memory + Disk) for crawl results.
 */
export class CacheManager {
  private cache: SimpleCache<string, CrawlResult>;
  private cacheDir?: string;

  constructor(size: number = 1000, cacheDir?: string) {
    this.cache = new SimpleCache(size);
    this.cacheDir = cacheDir;

    if (this.cacheDir) {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    }
  }

  private getFilePath(key: string): string | undefined {
    if (!this.cacheDir) return undefined;
    // Use hash of URL for filename to avoid filesystem issues
    const hash = crypto.createHash('md5').update(key).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }

  /**
   * Retrieves a cached result by URL.
   */
  get(url: string): CrawlResult | undefined {
    const normalizedKey = normalizeUrl(url);

    // 1. Check Memory
    const memoryResult = this.cache.get(normalizedKey);
    if (memoryResult) return memoryResult;

    // 2. Check Disk
    if (this.cacheDir) {
      const filePath = this.getFilePath(normalizedKey);
      if (filePath && fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const result = JSON.parse(content) as CrawlResult;

          // Hydrate memory cache
          this.cache.set(normalizedKey, result);
          return result;
        } catch (_) {
          // Ignore corrupt cache files
        }
      }
    }

    return undefined;
  }

  /**
   * Stores a crawl result.
   */
  set(url: string, result: CrawlResult): void {
    const normalizedKey = normalizeUrl(url);

    // 1. Write to Memory
    this.cache.set(normalizedKey, result);

    // 2. Write to Disk
    if (this.cacheDir) {
      const filePath = this.getFilePath(normalizedKey);
      if (filePath) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(result), 'utf-8');
        } catch (_) {
          // Ignore write errors
        }
      }
    }
  }

  /**
   * Checks if a URL is in the cache.
   */
  has(url: string): boolean {
    const normalizedKey = normalizeUrl(url);
    if (this.cache.has(normalizedKey)) return true;

    if (this.cacheDir) {
      const filePath = this.getFilePath(normalizedKey);
      return !!(filePath && fs.existsSync(filePath));
    }

    return false;
  }

  /**
   * Clears the cache.
   */
  clear(): void {
    this.cache.clear();

    if (this.cacheDir && fs.existsSync(this.cacheDir)) {
      try {
        const files = fs.readdirSync(this.cacheDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.cacheDir, file));
          }
        }
      } catch (_) {
        // Ignore cleanup errors
      }
    }
  }
}
