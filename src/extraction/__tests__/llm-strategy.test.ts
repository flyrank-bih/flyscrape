import { describe, expect, it, vi } from 'vitest';
import type { JsonSchema, LLMProvider } from '../interfaces';
import { extractWithLlm } from '../llm-strategy';

// Mock LLM Provider
class MockProvider implements LLMProvider {
  constructor(private response: string | object) {}

  async generate(_prompt: string): Promise<string> {
    if (typeof this.response === 'string') {
      return this.response;
    }
    return JSON.stringify(this.response);
  }
}

describe('extractWithLlm', () => {
  const content = 'The product is a Super Widget costing $19.99.';
  const schema: JsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      price: { type: 'number' },
    },
    required: ['name', 'price'],
  };

  it('should extract valid JSON', async () => {
    const provider = new MockProvider({
      name: 'Super Widget',
      price: 19.99,
    });

    const result = await extractWithLlm(content, schema, provider);

    expect(result.data).toEqual({
      name: 'Super Widget',
      price: 19.99,
    });
    expect(result.metadata?.error).toBeUndefined();
  });

  it('should handle markdown code blocks in response', async () => {
    const provider = new MockProvider(
      '```json\n{"name": "Super Widget", "price": 19.99}\n```',
    );

    const result = await extractWithLlm(content, schema, provider);

    expect(result.data).toEqual({
      name: 'Super Widget',
      price: 19.99,
    });
  });

  it('should handle validation errors gracefully (warning)', async () => {
    // Missing required field 'price'
    const provider = new MockProvider({
      name: 'Super Widget',
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await extractWithLlm(content, schema, provider);

    expect(result.data).toEqual({ name: 'Super Widget' });
    // It should still return data but log a warning
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should return error on invalid JSON', async () => {
    const provider = new MockProvider('Not JSON');

    const result = await extractWithLlm(content, schema, provider);

    expect(result.data).toBeNull();
    expect(result.metadata?.error).toContain('Failed to parse LLM response');
  });

  it('should return error on empty content', async () => {
    const provider = new MockProvider({});
    const result = await extractWithLlm('', schema, provider);
    expect(result.metadata?.error).toBe('Empty content');
  });
});
