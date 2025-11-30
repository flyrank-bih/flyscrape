import type { Options as TurndownOptions } from 'turndown';
import { type CleanHtmlOptions, cleanHtml } from '../../utils/dom';
import { convertToCitations, formatReferences } from './citations';
import { createTurndownService } from './turndown-ext';

export interface MarkdownGeneratorOptions {
  /**
   * Options for HTML cleaning before conversion.
   */
  cleanOptions?: CleanHtmlOptions;

  /**
   * Options for Turndown service.
   */
  turndownOptions?: TurndownOptions;

  /**
   * Whether to generate a citation-style markdown version.
   * @default true
   */
  enableCitations?: boolean;

  /**
   * Whether to skip internal links (anchors) in citations.
   * @default true
   */
  skipInternalLinks?: boolean;

  /**
   * Custom transformer function to override default markdown generation.
   * This allows implementing custom strategies for HTML to Markdown conversion.
   */
  customTransformer?: (html: string) => string;
}

export interface MarkdownGenerationResult {
  /**
   * The raw markdown content (standard links).
   */
  rawMarkdown: string;

  /**
   * Markdown with links converted to [text][i] citations.
   * Only present if enableCitations is true.
   */
  markdownWithCitations?: string;

  /**
   * The list of references generated from citations.
   * Only present if enableCitations is true.
   */
  referencesMarkdown?: string;
}

/**
 * Generates markdown from HTML.
 * @param html The HTML content.
 * @param options Generation options.
 * @returns The generation result.
 */
export function generateMarkdown(
  html: string,
  options: MarkdownGeneratorOptions = {},
): MarkdownGenerationResult {
  if (!html) {
    return { rawMarkdown: '' };
  }

  // 1. Clean HTML
  const cleanedHtml = cleanHtml(html, options.cleanOptions);

  // 2. Convert to Markdown
  let rawMarkdown = '';
  if (options.customTransformer) {
    rawMarkdown = options.customTransformer(cleanedHtml);
  } else {
    const service = createTurndownService(options.turndownOptions);
    rawMarkdown = service.turndown(cleanedHtml);
  }

  // 3. Generate Citations (if enabled)
  if (options.enableCitations !== false) {
    const { markdown, references } = convertToCitations(rawMarkdown);
    const referencesMarkdown = formatReferences(references);

    return {
      rawMarkdown,
      markdownWithCitations: markdown,
      referencesMarkdown,
    };
  }

  return { rawMarkdown };
}

/**
 * Default generator instance for convenience.
 */
export const markdownGenerator = {
  generate: generateMarkdown,
};
