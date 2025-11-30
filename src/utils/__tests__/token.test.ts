import { afterAll, describe, expect, it } from 'vitest';
import { Tokenizer } from '../token';

describe('Tokenizer', () => {
  // Use a separate instance for testing to avoid side effects on the global singleton
  const tokenizer = new Tokenizer({ enableCache: true });

  afterAll(() => {
    tokenizer.dispose();
  });

  it('should count tokens correctly', () => {
    const text = 'Hello world';
    const count = tokenizer.count(text);
    expect(count).toBeGreaterThan(0);
    // "Hello world" is typically 2 tokens in gpt-4o-mini-turbo
    expect(count).toBe(2);
  });

  it('should truncate text correctly', () => {
    const text = 'Hello world this is a test';
    // "Hello world this is a test" -> [15496, 995, 428, 374, 264, 1296] (6 tokens)

    const limit = 3;
    const truncated = tokenizer.truncate(text, limit);
    const count = tokenizer.count(truncated);

    expect(count).toBeLessThanOrEqual(limit);
    expect(count).toBe(3);
    // "Hello world this"
    expect(truncated).toContain('Hello');
  });

  it('should encode and decode correctly', () => {
    const text = 'Test encoding';
    const tokens = tokenizer.encode(text);
    const decoded = tokenizer.decode(tokens);
    expect(decoded).toBe(text);
  });

  it('should handle empty strings', () => {
    expect(tokenizer.count('')).toBe(0);
    expect(tokenizer.truncate('', 10)).toBe('');
    expect(tokenizer.encode('').length).toBe(0);
    expect(tokenizer.decode([])).toBe('');
  });

  it('should support different models', () => {
    // gpt-4 might have different tokenization for some strings, but usually similar to 3.5
    const text = 'Hello world';
    const count = tokenizer.count(text, 'gpt-4');
    expect(count).toBeGreaterThan(0);
  });

  it('should handle caching', () => {
    const text = 'Cache test string';
    const count1 = tokenizer.count(text);
    const count2 = tokenizer.count(text);
    expect(count1).toBe(count2);
  });

  it('should dispose correctly', () => {
    const tempTokenizer = new Tokenizer();
    tempTokenizer.count('test');
    tempTokenizer.dispose();
    // Accessing after dispose might throw or recreate depending on implementation details of tiktoken
    // But our wrapper clears the map.
    // Calling count again will try to create a NEW encoder.
    expect(() => tempTokenizer.count('test')).not.toThrow();
  });
});
