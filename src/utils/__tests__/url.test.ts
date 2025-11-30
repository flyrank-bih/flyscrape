import { describe, expect, it } from 'vitest';
import { isExternalUrl, isLocalFile, isSitemap, normalizeUrl } from '../url';

describe('UrlUtils', () => {
  describe('normalize', () => {
    it('should normalize basic URLs', () => {
      const url = 'https://Example.COM/Foo';
      // Hostname becomes lowercase, path case is preserved usually?
      // URL() lowercases hostname. Path is usually case sensitive.
      expect(normalizeUrl(url)).toBe('https://example.com/Foo');
    });

    it('should sort query parameters', () => {
      const url = 'https://example.com?b=2&a=1';
      expect(normalizeUrl(url)).toBe('https://example.com/?a=1&b=2');
    });

    it('should remove analytics parameters by default', () => {
      const url = 'https://example.com?utm_source=google&q=test&fbclid=123';
      expect(normalizeUrl(url)).toBe('https://example.com/?q=test');
    });

    it('should strip fragments by default', () => {
      const url = 'https://example.com#section';
      expect(normalizeUrl(url)).toBe('https://example.com/');
    });

    it('should not strip fragments if configured', () => {
      const url = 'https://example.com#section';
      expect(normalizeUrl(url, { stripHash: false })).toBe(
        'https://example.com/#section',
      );
    });

    it('should strip www if configured', () => {
      const url = 'https://www.example.com';
      expect(normalizeUrl(url, { stripWWW: true })).toBe(
        'https://example.com/',
      );
    });

    it('should return original string if invalid', () => {
      const url = 'not a url';
      expect(normalizeUrl(url)).toBe('not a url');
    });
  });

  describe('isSitemap', () => {
    it('should detect sitemap.xml', () => {
      expect(isSitemap('https://example.com/sitemap.xml')).toBe(true);
    });

    it('should detect path ending in sitemap', () => {
      expect(isSitemap('https://example.com/sitemap')).toBe(true);
    });

    it('should detect .xml extension', () => {
      expect(isSitemap('https://example.com/feed.xml')).toBe(true);
    });

    it('should return false for normal pages', () => {
      expect(isSitemap('https://example.com/page')).toBe(false);
    });
  });

  describe('isLocalFile', () => {
    it('should detect file:// protocol', () => {
      expect(isLocalFile('file:///tmp/test.txt')).toBe(true);
    });

    it('should detect unix absolute path', () => {
      expect(isLocalFile('/tmp/test.txt')).toBe(true);
    });

    it('should detect windows absolute path', () => {
      expect(isLocalFile('C:\\Users\\test.txt')).toBe(true);
    });

    it('should return false for http urls', () => {
      expect(isLocalFile('http://example.com')).toBe(false);
    });
  });

  describe('isExternal', () => {
    it('should return true for different domains', () => {
      expect(isExternalUrl('https://google.com', 'https://example.com')).toBe(
        true,
      );
    });

    it('should return false for same domain', () => {
      expect(
        isExternalUrl('https://example.com/page', 'https://example.com'),
      ).toBe(false);
    });

    it('should return false for relative urls', () => {
      expect(isExternalUrl('/page', 'https://example.com')).toBe(false);
    });

    it('should return true for subdomain if strict? No, standard isExternal usually checks hostname difference.', () => {
      // Depending on implementation, subdomains might be considered external or internal.
      // Our implementation checks exact hostname equality.
      expect(
        isExternalUrl('https://sub.example.com', 'https://example.com'),
      ).toBe(true);
    });
  });
});
