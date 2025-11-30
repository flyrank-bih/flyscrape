// This file would typically contain Zod schemas or other validation logic
// if we were validating external config input. For now, we'll keep it simple
// and potentially use it for type guards or runtime validation helpers.

import type { BrowserConfig, CrawlerConfig } from '../core/types';

/**
 * Validates and merges partial browser config with defaults.
 */
export function mergeBrowserConfig(
  defaultConfig: BrowserConfig,
  userConfig: Partial<BrowserConfig> = {},
): BrowserConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    viewport: {
      width:
        userConfig.viewport?.width ?? defaultConfig.viewport?.width ?? 1280,
      height:
        userConfig.viewport?.height ?? defaultConfig.viewport?.height ?? 720,
    },
    proxy: userConfig.proxy || defaultConfig.proxy,
    args: userConfig.args || defaultConfig.args,
  };
}

/**
 * Validates and merges partial crawler config with defaults.
 */
export function mergeCrawlerConfig(
  defaultConfig: CrawlerConfig,
  userConfig: Partial<CrawlerConfig> = {},
): CrawlerConfig {
  return {
    ...defaultConfig,
    ...userConfig,
  };
}
