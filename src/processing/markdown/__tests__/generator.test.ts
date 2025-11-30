import { describe, expect, it } from 'vitest';
import { convertToCitations, formatReferences } from '../citations';
import { generateMarkdown } from '../generator';

describe('Markdown Generator', () => {
  describe('generateMarkdown', () => {
    it('should convert basic html to markdown', () => {
      const html = '<h1>Title</h1><p>Content</p>';
      const result = generateMarkdown(html);
      expect(result.rawMarkdown).toContain('# Title');
      expect(result.rawMarkdown).toContain('Content');
    });

    it('should clean html before conversion', () => {
      const html = '<div><script>alert(1)</script><p>Content</p></div>';
      const result = generateMarkdown(html);
      expect(result.rawMarkdown).not.toContain('alert');
      expect(result.rawMarkdown).toContain('Content');
    });

    it('should generate citations by default', () => {
      const html = '<p>See <a href="https://example.com">Example</a></p>';
      const result = generateMarkdown(html);

      expect(result.rawMarkdown).toContain('[Example](https://example.com)');

      expect(result.markdownWithCitations).toBeDefined();
      expect(result.markdownWithCitations).toContain('[Example][1]');

      expect(result.referencesMarkdown).toBeDefined();
      expect(result.referencesMarkdown).toContain('1. https://example.com');
    });
  });

  describe('Citations Utils', () => {
    it('should deduplicate references', () => {
      const markdown = 'Link 1 [A](http://a.com) and Link 2 [B](http://a.com)';
      const { markdown: converted, references } = convertToCitations(markdown);

      expect(converted).toBe('Link 1 [A][1] and Link 2 [B][1]');
      expect(references).toHaveLength(1);
      expect(references[0]).toBe('http://a.com');
    });

    it('should handle multiple different references', () => {
      const markdown = 'Link 1 [A](http://a.com) and Link 2 [B](http://b.com)';
      const { markdown: converted, references } = convertToCitations(markdown);

      expect(converted).toBe('Link 1 [A][1] and Link 2 [B][2]');
      expect(references).toHaveLength(2);
      expect(references[0]).toBe('http://a.com');
      expect(references[1]).toBe('http://b.com');
    });

    it('should format reference list', () => {
      const refs = ['http://a.com', 'http://b.com'];
      const formatted = formatReferences(refs);

      expect(formatted).toContain('## References');
      expect(formatted).toContain('1. http://a.com');
      expect(formatted).toContain('2. http://b.com');
    });
  });
});
