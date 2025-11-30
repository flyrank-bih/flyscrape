import { describe, expect, it } from 'vitest';
import { DEFAULT_BROWSER_CONFIG, DEFAULT_CRAWLER_CONFIG } from '../defaults';
import { mergeBrowserConfig, mergeCrawlerConfig } from '../schemas';

describe('Config Schemas', () => {
  it('should merge browser config with defaults', () => {
    const userConfig = {
      headless: false,
      viewport: { width: 1920, height: 1080 },
    };

    const merged = mergeBrowserConfig(DEFAULT_BROWSER_CONFIG, userConfig);

    expect(merged.headless).toBe(false);
    expect(merged.viewport?.width).toBe(1920);
    expect(merged.viewport?.height).toBe(1080);
    // Should preserve defaults
    expect(merged.args).toEqual(DEFAULT_BROWSER_CONFIG.args);
  });

  it('should merge partial viewport', () => {
    const userConfig = {
      viewport: { width: 1024 }, // missing height
      // biome-ignore lint/suspicious/noExplicitAny: <Test case, not production code>
    } as any;

    const merged = mergeBrowserConfig(DEFAULT_BROWSER_CONFIG, userConfig);
    expect(merged.viewport?.width).toBe(1024);
    expect(merged.viewport?.height).toBe(
      DEFAULT_BROWSER_CONFIG.viewport?.height,
    );
  });

  it('should merge crawler config with defaults', () => {
    const userConfig = {
      maxConcurrency: 10,
    };

    const merged = mergeCrawlerConfig(DEFAULT_CRAWLER_CONFIG, userConfig);

    expect(merged.maxConcurrency).toBe(10);
    expect(merged.cacheEnabled).toBe(DEFAULT_CRAWLER_CONFIG.cacheEnabled);
  });
});
