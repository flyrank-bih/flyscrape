'use server';

import { AsyncWebCrawler } from '@flyrank/flyscrape';

export async function scrapeUrl(
  url: string,
  options: {
    contentOnly?: boolean;
    excludeMedia?: boolean;
    optimizeWithAI?: boolean;
  } = {},
) {
  try {
    console.log('Starting scrape for:', url, 'Options:', options);
    const crawler = new AsyncWebCrawler();

    // Use arun which is the main entry point
    const result = await crawler.arun(url, {
      contentOnly: options.contentOnly,
      excludeMedia: options.excludeMedia,
      optimizeWithAI: options.optimizeWithAI,
      // In a real app, ensure process.env.OPENAI_API_KEY is set
      openaiApiKey: process.env.OPENAI_API_KEY,
    });

    // Serialization for Next.js server actions
    // We return a plain object.
    return { success: true as const, data: result };
  } catch (error) {
    console.error('Scrape error:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
