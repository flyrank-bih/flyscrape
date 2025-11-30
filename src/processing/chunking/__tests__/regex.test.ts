import { describe, expect, it } from 'vitest';
import { regexChunk } from '../regex';

describe('Regex Chunking', () => {
  it('should split by double newlines by default', () => {
    const text = 'Para 1\n\nPara 2\n\nPara 3';
    const chunks = regexChunk(text);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe('Para 1');
    expect(chunks[1]).toBe('Para 2');
    expect(chunks[2]).toBe('Para 3');
  });

  it('should handle custom patterns', () => {
    const text = 'Sentence 1. Sentence 2. Sentence 3.';
    // Split by period followed by space
    const chunks = regexChunk(text, [/\. /]);
    expect(chunks).toHaveLength(3);
    // Note: split removes the separator. "Sentence 1"
    // The last one "Sentence 3." remains as is because no ". " after it.
    expect(chunks[0]).toBe('Sentence 1');
    expect(chunks[1]).toBe('Sentence 2');
    expect(chunks[2]).toBe('Sentence 3.');
  });

  it('should handle multiple patterns iteratively', () => {
    const text = 'Section 1\n\nSubsection A. Subsection B.';
    // Split by \n\n then by .
    const chunks = regexChunk(text, [/\n\n/, /\. /]);
    // Expected: ["Section 1", "Subsection A", "Subsection B."]
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe('Section 1');
    expect(chunks[1]).toBe('Subsection A');
    expect(chunks[2]).toBe('Subsection B.');
  });

  it('should filter empty chunks', () => {
    const text = 'Para 1\n\n\n\nPara 2'; // Multiple newlines
    const chunks = regexChunk(text);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe('Para 1');
    expect(chunks[1]).toBe('Para 2');
  });

  it('should return empty array for empty text', () => {
    expect(regexChunk('')).toEqual([]);
  });
});
