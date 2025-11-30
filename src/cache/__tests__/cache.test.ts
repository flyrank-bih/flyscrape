import { beforeEach, describe, expect, it } from "vitest";
import type { CrawlResult } from "../../core/types";
import { CacheManager } from "../index";

describe("CacheManager", () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager(10); // Small size for testing
  });

  it("should store and retrieve values", () => {
    const url = "https://example.com";
    const result: CrawlResult = {
      url,
      html: "<html></html>",
      success: true,
    };

    cacheManager.set(url, result);
    const retrieved = cacheManager.get(url);

    expect(retrieved).toEqual(result);
  });

  it("should return undefined for missing keys", () => {
    expect(cacheManager.get("missing")).toBeUndefined();
  });

  it("should check for existence", () => {
    const url = "https://example.com";
    const result: CrawlResult = { url, html: "", success: true };

    cacheManager.set(url, result);
    expect(cacheManager.has(url)).toBe(true);
    expect(cacheManager.has("missing")).toBe(false);
  });

  it("should clear cache", () => {
    const url = "https://example.com";
    cacheManager.set(url, { url, html: "", success: true });

    cacheManager.clear();
    expect(cacheManager.has(url)).toBe(false);
  });
});
