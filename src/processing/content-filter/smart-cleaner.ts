/** biome-ignore-all lint/suspicious/noExplicitAny: <Technical debt> */
import type * as cheerio from 'cheerio';
import { loadHtml } from '../../utils/dom';

/**
 * Options for the smart content cleaner.
 */
export interface SmartCleanOptions {
  /**
   * Whether to remove images, videos, and other media.
   * @default false
   */
  excludeMedia?: boolean;

  /**
   * Aggressiveness level of cleaning.
   * @default 'moderate'
   */
  mode?: 'strict' | 'moderate' | 'lax';
  /**
   * Whether to use OpenAI to optimize the content extraction.
   * Requires apiKey to be provided.
   */
  optimizeWithAI?: boolean;

  /**
   * OpenAI API Key for optimization.
   */
  openaiApiKey?: string;
}

// Common noise patterns (Regex)
const NOISE_PATTERNS = [
  /cookie/i,
  /popup/i,
  /subscribe/i,
  /newsletter/i,
  /ad-?wrapper/i,
  /advertisement/i,
  /banner/i,
  /social-share/i,
  /share-buttons/i,
  /(^|\s)sidebar(\s|$)/i, // stricter sidebar matching
  /related-posts/i,
  /recommended/i,
  /comment/i,
  /meta-info/i,
  /author-box/i,
  /breadcrumbs/i,
  /navigation/i,
  /(^|\s)menu(\s|$)/i, // stricter menu matching
  /(^|\s)header(\s|$)/i, // stricter header matching
  /(^|\s)footer(\s|$)/i, // stricter footer matching
  /copyright/i,
  /disclaimer/i,
  /modal/i,
  /toast/i,
  /widget/i,
  /search/i,
  /gdpr/i,
  /consent/i,
  /promo/i,
  /sticky/i,
  /chat/i,
  /live-chat/i,
  /intercom/i,
  /crisp/i,
  /zendesk/i,
  /drift/i,
  /hubspot/i,
  /login/i,
  /sign-up/i,
  /register/i,
  /overlay/i,
];

const ECOMMERCE_NOISE = [
  /cart/i,
  /checkout/i,
  /basket/i,
  /shopify-section-header/i,
  /shopify-section-footer/i,
  /minicart/i,
  /ajax-cart/i,
  /add-to-cart/i,
  /price-box/i,
  /product-form/i,
  /wishlist/i,
  /compare/i,
  /upsell/i,
  /cross-sell/i,
];

const NOISE_TAGS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'form',
  'button',
  'input',
  'select',
  'textarea',
  'nav',
  'footer',
  'header',
  'aside',
  'dialog',
  'canvas',
  'map',
  'picture',
  'source',
];

// Fallback selectors for main content
const FALLBACK_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '.main-content',
  '#main-content',
  '.content-area',
  '#content',
  '.post-content',
  '.blog-post',
  '.article-body',
  '.entry-content',
  '.page-content',
  '.section-content',
];

/**
 * Analyzes and cleans HTML to extract the main content using scoring heuristics.
 */
export async function smartClean(
  html: string | cheerio.CheerioAPI,
  options: SmartCleanOptions = {},
): Promise<string> {
  const $ = typeof html === 'string' ? loadHtml(html) : html;

  // 1. Initial Strip of unwanted tags
  $(NOISE_TAGS.join(',')).remove();

  // 2. Strip by Class/ID Noise Patterns
  const allElements = $('*');
  allElements.each((_, el) => {
    const attribs = (el as any).attribs || {};
    const id = attribs.id || '';
    const classNames = attribs.class || '';
    const role = attribs.role || '';
    const combined = `${id} ${classNames} ${role}`;

    if (
      NOISE_PATTERNS.some((p) => p.test(combined)) ||
      ECOMMERCE_NOISE.some((p) => p.test(combined))
    ) {
      $(el).remove();
    }
  });

  // 3. Media Handling
  if (options.excludeMedia) {
    $(
      'img, video, audio, source, track, object, embed, figure, picture',
    ).remove();
  }

  // 4. Scoring Algorithm (Readability-lite)
  // We want to find the container with the most "content-like" text.
  const candidates = new Map<any, number>();

  $('p, div, article, section').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length < 20) return; // Ignore short snippets

    // Base score based on text length
    let score = 1;
    score += text.split(',').length; // More commas often means natural language
    score += Math.min(Math.floor(text.length / 100), 3); // Bonus for length

    // Add to parent
    const parent = $(el).parent();
    if (parent.length) {
      const current = candidates.get(parent[0]) || 0;
      candidates.set(parent[0], current + score);

      // Add to grand-parent (decayed)
      const grandParent = parent.parent();
      if (grandParent.length) {
        const gpCurrent = candidates.get(grandParent[0]) || 0;
        candidates.set(grandParent[0], gpCurrent + score / 2);
      }
    }
  });

  // Find top candidate
  let topCandidate: any = null;
  let maxScore = 0;

  candidates.forEach((score, node) => {
    if (score > maxScore) {
      maxScore = score;
      topCandidate = node;
    }
  });
  // If we found a top candidate, use it. Otherwise fallback to body.
  // Also check if <main> or <article> exists and has a decent score, prefer semantic tags if scores are close.

  let finalHtml = '';

  if (topCandidate) {
    finalHtml = $(topCandidate).html() || '';
  }

  // Fallback if no top candidate or empty result
  if (!finalHtml || finalHtml.trim().length < 50) {
    for (const selector of FALLBACK_SELECTORS) {
      const el = $(selector);
      if (el.length) {
        const html = el.html() || '';
        if (html.trim().length > 50) {
          finalHtml = html;
          break;
        }
      }
    }
  }

  // Final fallback to body
  if (!finalHtml || finalHtml.trim().length < 50) {
    finalHtml = $('body').html() || $.html();
  }

  // 5. Final pass on the result to remove empty containers
  const $final = loadHtml(finalHtml);
  $final('div, section, span').each((_, el) => {
    if (
      $final(el).text().trim() === '' &&
      $final(el).find('img').length === 0
    ) {
      $final(el).remove();
    }
  });

  let result = $final.html();

  // 6. OpenAI Optimization (Optional)
  if (options.optimizeWithAI && options.openaiApiKey && result) {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert content extractor. Extract the main article content from the provided HTML. Remove any navigation, ads, footers, sidebars, and other non-content elements. Return ONLY the clean HTML of the main article content. Do not include markdown formatting or code blocks, just the raw HTML string.',
              },
              { role: 'user', content: result },
            ],
            temperature: 0.3,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          // Remove any markdown code blocks if present
          result = content.replace(/^```html\s*/, '').replace(/\s*```$/, '');
        }
      } else {
        console.warn(
          `OpenAI optimization failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (e) {
      console.warn('OpenAI optimization error:', e);
    }
  }

  return result;
}
