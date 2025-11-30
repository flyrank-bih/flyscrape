import * as cheerio from "cheerio";

/**
 * Loads HTML content into a Cheerio instance.
 * @param html The HTML content to load.
 * @returns The Cheerio API instance.
 */
export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}

/**
 * Options for HTML cleaning.
 */
export interface CleanHtmlOptions {
  /**
   * Tags to remove from the HTML.
   * @default ['script', 'style', 'noscript', 'iframe', 'svg']
   */
  excludeTags?: string[];

  /**
   * Whether to remove comments.
   * @default true
   */
  removeComments?: boolean;
}

/**
 * Cleans HTML by removing unwanted tags and comments.
 * @param html The HTML content or Cheerio instance.
 * @param options Cleaning options.
 * @returns The cleaned HTML string.
 */
export function cleanHtml(
  html: string | cheerio.CheerioAPI,
  options: CleanHtmlOptions = {}
): string {
  const $ = typeof html === "string" ? loadHtml(html) : html;
  const excludeTags = options.excludeTags || [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "link",
    "meta",
  ];

  // Remove excluded tags
  $(excludeTags.join(",")).remove();

  // Remove comments if requested
  if (options.removeComments !== false) {
    $("*")
      .contents()
      .each((_, elem) => {
        if (elem.type === "comment") {
          $(elem).remove();
        }
      });
  }

  return $.html();
}

/**
 * Extracts plain text from HTML, stripping all tags.
 * @param html The HTML content.
 * @returns The extracted text.
 */
export function extractText(html: string): string {
  const $ = loadHtml(html);
  return $.text().trim();
}

/**
 * Extracts all links (href attributes) from the HTML.
 * @param html The HTML content or Cheerio instance.
 * @returns Array of link URLs.
 */
export function extractLinks(html: string | cheerio.CheerioAPI): string[] {
  const $ = typeof html === "string" ? loadHtml(html) : html;
  const links: string[] = [];

  $("a").each((_, elem) => {
    const href = $(elem).attr("href");
    if (href) {
      links.push(href);
    }
  });

  return links;
}

/**
 * Extracts metadata (title, description, keywords) from HTML.
 * @param html The HTML content or Cheerio instance.
 * @returns Object containing title, description, and keywords.
 */
export function extractMetadata(html: string | cheerio.CheerioAPI): {
  title: string;
  description?: string;
  keywords?: string;
} {
  const $ = typeof html === "string" ? loadHtml(html) : html;
  const title = $("title").text();
  const description = $('meta[name="description"]').attr("content");
  const keywords = $('meta[name="keywords"]').attr("content");

  return {
    title,
    description,
    keywords,
  };
}

/**
 * Calculates the text density of a block element.
 * Useful for heuristic pruning (detecting main content vs boilerplate).
 * @param html The HTML fragment of the block.
 * @returns The density score (text length / html length).
 */
export function calculateTextDensity(html: string): number {
  if (!html || html.length === 0) return 0;

  const text = extractText(html);
  // Simple density: text length / total HTML length
  // This is a primitive version of the metric used in PruningContentFilter
  return text.length / html.length;
}
