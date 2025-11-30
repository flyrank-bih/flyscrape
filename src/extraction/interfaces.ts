/**
 * Represents a schema for JSON data.
 * Can be a simple object describing the structure.
 */
export interface JsonSchema {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  [key: string]: any;
}

/**
 * Schema for CSS selector-based extraction.
 * Keys are field names, values are CSS selectors or configuration objects.
 */
export interface CSSSchema {
  [field: string]: string | CSSFieldConfig;
}

/**
 * Configuration for a single field in CSS extraction.
 */
export interface CSSFieldConfig {
  /**
   * The CSS selector to find the element.
   */
  selector: string;

  /**
   * The attribute to extract (e.g., 'href', 'src').
   * If omitted, extracts text content.
   */
  attribute?: string;

  /**
   * Whether to extract as HTML instead of text.
   * @default false
   */
  asHtml?: boolean;

  /**
   * Transform function to apply to the extracted value.
   */
  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  transform?: (value: string) => any;

  /**
   * Whether to extract a list of items matching the selector.
   * @default false
   */
  list?: boolean;
}

/**
 * Result of an extraction operation.
 */
// biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
export interface ExtractionResult<T = any> {
  /**
   * The extracted data.
   */
  data: T;

  /**
   * Metadata about the extraction process.
   */
  metadata?: {
    tokensUsed?: number;
    executionTimeMs?: number;
    provider?: string;
    error?: string;
  };
}

/**
 * Interface for LLM providers used in extraction.
 */
export interface LLMProvider {
  /**
   * Generates a completion based on the prompt.
   * @param prompt The prompt to send to the LLM.
   * @param options Optional parameters (temperature, etc.).
   * @returns The generated text.
   */
  // biome-ignore lint/suspicious/noExplicitAny: <Technical debt>
  generate(prompt: string, options?: any): Promise<string>;
}
