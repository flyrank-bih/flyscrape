import * as cheerio from 'cheerio';
import { describe, expect, it } from 'vitest';
import { smartClean } from '../smart-cleaner';
import {
  BLOG_POST_HTML,
  ECOMMERCE_PRODUCT_HTML,
  NOISY_PAGE_HTML,
} from './mock-html';

describe('Smart Content Cleaner', () => {
  it('should extract main article content and remove noise (nav, sidebar, footer)', async () => {
    const cleaned = await smartClean(BLOG_POST_HTML);
    const $ = cheerio.load(cleaned);

    // Should keep content
    expect($('h1').text()).toContain('How to Migrate');
    expect($('.post-content').length).toBe(1);
    expect($('p').text()).toContain('This is the first paragraph');

    // Should remove noise
    expect($('nav').length).toBe(0);
    expect($('footer').length).toBe(0);
    expect($('.sidebar').length).toBe(0);
    expect($('#comments').length).toBe(0);
    expect($('.share-buttons').length).toBe(0);
  });

  it('should remove media when excludeMedia is true', async () => {
    const cleaned = await smartClean(BLOG_POST_HTML, { excludeMedia: true });
    const $ = cheerio.load(cleaned);

    expect($('img').length).toBe(0);
    expect($('.post-content').text()).toContain('This is the first paragraph');
  });

  it('should keep media by default', async () => {
    const cleaned = await smartClean(BLOG_POST_HTML, { excludeMedia: false });
    const $ = cheerio.load(cleaned);

    expect($('img').length).toBeGreaterThan(0);
  });

  it('should extract product description and remove cart elements', async () => {
    const cleaned = await smartClean(ECOMMERCE_PRODUCT_HTML);
    const $ = cheerio.load(cleaned);

    // Should keep product info
    expect($('h1').text()).toContain('Awesome Widget');
    expect($('.product-description').text()).toContain(
      'This is an awesome widget',
    );

    // Should remove cart/checkout noise
    expect($('.add-to-cart').length).toBe(0);
    expect($('.cart-drawer').length).toBe(0);
    expect($('#shopify-section-header').length).toBe(0);
  });

  it('should identify main content based on scoring even with deep nesting', async () => {
    const cleaned = await smartClean(NOISY_PAGE_HTML);
    const $ = cheerio.load(cleaned);

    expect($('.article-body').length).toBe(1);
    expect($('.article-body').text()).toContain('This is the real content');

    expect($('.cookie-consent').length).toBe(0);
    expect($('.newsletter-popup').length).toBe(0);
    expect($('.author-box').length).toBe(0);
  });
});
