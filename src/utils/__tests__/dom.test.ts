import { describe, expect, it } from 'vitest';
import {
  calculateTextDensity,
  cleanHtml,
  extractLinks,
  extractText,
} from '../dom';

describe('Dom Utils', () => {
  describe('cleanHtml', () => {
    it('should remove script tags', () => {
      const html = '<div><script>alert(1)</script><p>content</p></div>';
      const cleaned = cleanHtml(html);
      expect(cleaned).not.toContain('<script>');
      expect(cleaned).toContain('<p>content</p>');
    });

    it('should remove style tags', () => {
      const html =
        '<div><style>body { color: red; }</style><p>content</p></div>';
      const cleaned = cleanHtml(html);
      expect(cleaned).not.toContain('<style>');
      expect(cleaned).toContain('<p>content</p>');
    });

    it('should remove comments by default', () => {
      const html = '<div><!-- comment --><p>content</p></div>';
      const cleaned = cleanHtml(html);
      expect(cleaned).not.toContain('<!-- comment -->');
      expect(cleaned).toContain('<p>content</p>');
    });

    it('should keep comments if configured', () => {
      const html = '<div><!-- comment --><p>content</p></div>';
      const cleaned = cleanHtml(html, { removeComments: false });
      expect(cleaned).toContain('<!-- comment -->');
    });

    it('should allow custom exclude tags', () => {
      const html = '<div><span>remove me</span><p>keep me</p></div>';
      const cleaned = cleanHtml(html, { excludeTags: ['span'] });
      expect(cleaned).not.toContain('<span>');
      expect(cleaned).toContain('<p>keep me</p>');
    });
  });

  describe('extractText', () => {
    it('should extract plain text', () => {
      const html = '<div><h1>Title</h1><p>Paragraph</p></div>';
      const text = extractText(html);
      expect(text).toContain('Title');
      expect(text).toContain('Paragraph');
      expect(text).not.toContain('<div>');
    });

    it('should handle empty html', () => {
      const text = extractText('');
      expect(text).toBe('');
    });
  });

  describe('extractLinks', () => {
    it('should extract hrefs', () => {
      const html = `
        <div>
          <a href="https://example.com">Link 1</a>
          <a href="/local/path">Link 2</a>
          <a>No href</a>
        </div>
      `;
      const links = extractLinks(html);
      expect(links).toHaveLength(2);
      expect(links).toContain('https://example.com');
      expect(links).toContain('/local/path');
    });
  });

  describe('calculateTextDensity', () => {
    it('should calculate density correctly', () => {
      const html = '<div><p>Hello world</p></div>';
      const density = calculateTextDensity(html);
      // Text: "Hello world" (11 chars)
      // HTML: "<div><p>Hello world</p></div>" (29 chars) -> cheerio might modify structure slightly
      // density ~ 11/29 = 0.37
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThan(1);
    });

    it('should return 0 for empty html', () => {
      expect(calculateTextDensity('')).toBe(0);
    });

    it('should return low density for heavy markup', () => {
      const html = '<div><div><div><div><p>Hi</p></div></div></div></div>';
      const density = calculateTextDensity(html);
      expect(density).toBeLessThan(0.2);
    });
  });
});
