import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CacheManager } from "../index";

describe("CacheManager Benchmark", () => {
  const TEST_CACHE_DIR = path.join(__dirname, "bench_cache");
  const ITERATIONS = 100; // Reduced for quicker execution during dev, increase for real bench

  beforeAll(() => {
    if (fs.existsSync(TEST_CACHE_DIR)) {
      fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_CACHE_DIR)) {
      fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });

  it("should benchmark memory-only operations", () => {
    const cache = new CacheManager(ITERATIONS * 2);

    const startWrite = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      cache.set(`http://example.com/${i}`, {
        url: `http://example.com/${i}`,
        html: "<html></html>",
        success: true,
      });
    }
    const endWrite = performance.now();
    console.log(
      `Memory Write (${ITERATIONS} ops): ${(endWrite - startWrite).toFixed(
        2
      )}ms`
    );

    const startRead = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      cache.get(`http://example.com/${i}`);
    }
    const endRead = performance.now();
    console.log(
      `Memory Read (${ITERATIONS} ops): ${(endRead - startRead).toFixed(2)}ms`
    );
  });

  it("should benchmark hybrid (disk+memory) operations", () => {
    const cache = new CacheManager(ITERATIONS * 2, TEST_CACHE_DIR);

    const startWrite = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      cache.set(`http://example.com/${i}`, {
        url: `http://example.com/${i}`,
        html: "<html></html>",
        success: true,
      });
    }
    const endWrite = performance.now();
    console.log(
      `Hybrid Write (${ITERATIONS} ops): ${(endWrite - startWrite).toFixed(
        2
      )}ms`
    );

    // New instance to force disk read
    const cache2 = new CacheManager(ITERATIONS * 2, TEST_CACHE_DIR);

    const startRead = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const result = cache2.get(`http://example.com/${i}`);
      expect(result).toBeDefined();
    }
    const endRead = performance.now();
    console.log(
      `Hybrid Read (Disk Hit) (${ITERATIONS} ops): ${(
        endRead - startRead
      ).toFixed(2)}ms`
    );
  });
});
