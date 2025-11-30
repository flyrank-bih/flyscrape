/** biome-ignore-all lint/suspicious/noExplicitAny: <Technical debt> */
import { tokenCounter } from '../utils/token';
import type { ExtractionResult, JsonSchema, LLMProvider } from './interfaces';
import { SchemaGenerator } from './schema-gen';

/**
 * Extracts structured data from content using an LLM.
 *
 * @param content The text content to extract from.
 * @param schema The JSON schema defining the desired output structure.
 * @param provider The LLM provider instance.
 * @param options Additional options for the extraction.
 * @returns The extracted data wrapped in an ExtractionResult.
 */
export async function extractWithLlm<T = any>(
  content: string,
  schema: JsonSchema,
  provider: LLMProvider,
  options: { instruction?: string; temperature?: number } = {},
): Promise<ExtractionResult<T>> {
  if (!content || !content.trim()) {
    return { data: null as any, metadata: { error: 'Empty content' } };
  }

  const schemaString = SchemaGenerator.toPromptString(schema);
  const instruction =
    options.instruction ||
    'Extract the following information from the provided text. Return ONLY the raw JSON object matching the schema, with no markdown formatting or explanation.';

  const prompt = `${instruction}

Schema:
${schemaString}

Content:
${content}

Output JSON:`;

  // Calculate input tokens for observability
  const inputTokens = tokenCounter.count(prompt);

  const startTime = Date.now();
  try {
    const response = await provider.generate(prompt, {
      temperature: options.temperature ?? 0,
      // You might want to add format: 'json_object' if the provider supports it
    });

    const executionTimeMs = Date.now() - startTime;
    const outputTokens = tokenCounter.count(response);

    // Clean up the response to ensure it's valid JSON
    // Remove markdown code blocks if present
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
    }

    let data: T;
    try {
      data = JSON.parse(cleanResponse);
    } catch (_) {
      throw new Error(
        `Failed to parse LLM response as JSON: ${cleanResponse.substring(
          0,
          100,
        )}...`,
      );
    }

    // Validate against schema (basic check)
    try {
      SchemaGenerator.validate(data, schema);
    } catch (e) {
      console.warn('Schema validation warning:', e);
      // We don't fail strictly here, but return the data with a warning?
      // Or we could re-throw. For now, let's just proceed as LLMs can be slightly off.
    }

    return {
      data,
      metadata: {
        executionTimeMs,
        provider: 'custom', // Could be retrieved from provider if interface allowed
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
      },
    };
  } catch (error: any) {
    return {
      data: null as any,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        error: error.message,
      },
    };
  }
}
