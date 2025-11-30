import { describe, expect, it } from 'vitest';
import { generateMarkdown } from '../generator';

describe('Markdown Generator - Custom Strategies', () => {
  const html = '<h1>Hello</h1><p>World</p>';

  it('should use custom transformer when provided', () => {
    const customTransformer = (inputHtml: string) => {
      return inputHtml
        .replace('<h1>', '# ')
        .replace('</h1>', '')
        .replace('<p>', '')
        .replace('</p>', '');
    };

    const result = generateMarkdown(html, {
      customTransformer,
      enableCitations: false,
    });

    expect(result.rawMarkdown).toContain('# HelloWorld');
  });

  it('should fall back to default turndown if no custom transformer', () => {
    const result = generateMarkdown(html, {
      enableCitations: false,
    });

    expect(result.rawMarkdown).toContain('# Hello');
    expect(result.rawMarkdown).toContain('World');
  });

  it('should still clean HTML before passing to custom transformer', () => {
    const dirtyHtml = '<h1>Hello</h1><script>alert(1)</script><p>World</p>';
    const customTransformer = (inputHtml: string) => inputHtml; // Pass through

    const result = generateMarkdown(dirtyHtml, {
      customTransformer,
      cleanOptions: { excludeTags: ['script'] },
    });

    expect(result.rawMarkdown).not.toContain('script');
    expect(result.rawMarkdown).toContain('<h1>Hello</h1>');
  });
});
