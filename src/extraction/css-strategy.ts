/** biome-ignore-all lint/suspicious/noExplicitAny: <Technical debt> */
import type * as cheerio from 'cheerio';
import { loadHtml } from '../utils/dom';
import type { CSSFieldConfig, CSSSchema } from './interfaces';

/**
 * Extracts data from HTML using CSS selectors.
 *
 * @param html The HTML string to extract from.
 * @param schema The schema defining fields and selectors.
 * @returns The extracted object.
 */
export function extractWithCss<T = any>(html: string, schema: CSSSchema): T {
  const $ = loadHtml(html);
  const result: any = {};

  for (const [field, config] of Object.entries(schema)) {
    if (typeof config === 'string') {
      // Simple selector case: extract text
      result[field] = $(config).text().trim();
    } else {
      // Configuration object case
      result[field] = extractField($, config);
    }
  }

  return result as T;
}

/**
 * Helper to extract a single field based on config.
 */
function extractField($: cheerio.CheerioAPI, config: CSSFieldConfig): any {
  const { selector, attribute, asHtml, list, transform } = config;
  const elements = $(selector);

  if (list) {
    const items: any[] = [];
    elements.each((_, el) => {
      items.push(extractValue($, $(el), attribute, asHtml, transform));
    });
    return items;
  } else {
    // Single item: use the first match
    return extractValue($, elements.first(), attribute, asHtml, transform);
  }
}

/**
 * Helper to extract value from an element.
 */
function extractValue(
  _$: cheerio.CheerioAPI,
  element: cheerio.Cheerio<any>,
  attribute?: string,
  asHtml?: boolean,
  transform?: (value: string) => any,
): any {
  if (element.length === 0) return null;

  let value: string;

  if (attribute) {
    value = element.attr(attribute) || '';
  } else if (asHtml) {
    value = element.html() || '';
  } else {
    value = element.text();
  }

  // Always trim whitespace for text/attributes (not HTML unless desired, but usually safe)
  if (!asHtml) {
    value = value.trim();
  }

  if (transform) {
    return transform(value);
  }

  return value;
}
