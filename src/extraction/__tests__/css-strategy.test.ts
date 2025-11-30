import { describe, expect, it } from 'vitest';
import { extractWithCss } from '../css-strategy';
import type { CSSSchema } from '../interfaces';

describe('extractWithCss', () => {
  const html = `
    <div class="product">
      <h1 id="title">Super Widget</h1>
      <span class="price">$19.99</span>
      <div class="description">A <b>great</b> widget.</div>
      <ul class="features">
        <li>Durable</li>
        <li>Lightweight</li>
      </ul>
      <a href="/buy" class="btn-buy">Buy Now</a>
    </div>
  `;

  it('should extract simple text fields', () => {
    const schema: CSSSchema = {
      title: '#title',
      price: '.price',
    };

    const result = extractWithCss(html, schema);
    expect(result).toEqual({
      title: 'Super Widget',
      price: '$19.99',
    });
  });

  it('should extract attributes', () => {
    const schema: CSSSchema = {
      buyLink: {
        selector: '.btn-buy',
        attribute: 'href',
      },
    };

    const result = extractWithCss(html, schema);
    expect(result).toEqual({
      buyLink: '/buy',
    });
  });

  it('should extract HTML content', () => {
    const schema: CSSSchema = {
      description: {
        selector: '.description',
        asHtml: true,
      },
    };

    const result = extractWithCss(html, schema);
    expect(result.description).toContain('<b>great</b>');
  });

  it('should extract lists', () => {
    const schema: CSSSchema = {
      features: {
        selector: '.features li',
        list: true,
      },
    };

    const result = extractWithCss(html, schema);
    expect(result.features).toEqual(['Durable', 'Lightweight']);
  });

  it('should apply transformations', () => {
    const schema: CSSSchema = {
      price: {
        selector: '.price',
        transform: (val) => parseFloat(val.replace('$', '')),
      },
    };

    const result = extractWithCss(html, schema);
    expect(result.price).toBe(19.99);
  });

  it('should handle missing elements gracefully', () => {
    const schema: CSSSchema = {
      missing: '.does-not-exist',
    };

    const result = extractWithCss(html, schema);
    expect(result.missing).toBe('');
  });
});
