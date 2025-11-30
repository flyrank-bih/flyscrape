import * as fs from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncWebCrawler } from '../crawler';

describe('Advanced Crawler Features', () => {
  let crawler: AsyncWebCrawler;
  const testDir = path.join(process.cwd(), 'test-temp');

  beforeEach(async () => {
    crawler = new AsyncWebCrawler({}, { verbose: false });
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await crawler.close();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should handle raw: protocol', async () => {
    const html = '<html><body><h1>Raw Content</h1></body></html>';
    const result = await crawler.arun(`raw:${html}`);

    expect(result.success).toBe(true);
    expect(result.html).toContain('<h1>Raw Content</h1>');
    expect(result.markdown).toContain('# Raw Content');
  });

  it('should handle file:// protocol', async () => {
    const filePath = path.join(testDir, 'test.html');
    const html = '<html><body><h1>File Content</h1></body></html>';
    await fs.writeFile(filePath, html);

    const result = await crawler.arun(`file://${filePath}`);

    expect(result.success).toBe(true);
    expect(result.html).toContain('<h1>File Content</h1>');
    expect(result.markdown).toContain('# File Content');
  });

  it('should extract media resources', async () => {
    const html = `
      <html>
        <body>
          <img src="image.jpg" alt="Test Image" />
          <video src="video.mp4" poster="poster.jpg"></video>
        </body>
      </html>
    `;
    const result = await crawler.arun(`raw:${html}`);

    expect(result.media?.images).toHaveLength(1);
    expect(result.media?.images[0].src).toBe('image.jpg');
    expect(result.media?.videos).toHaveLength(1);
    expect(result.media?.videos[0].src).toBe('video.mp4');
  });

  it('should extract extended metadata', async () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta property="og:title" content="OG Title" />
          <meta name="twitter:card" content="summary" />
          <meta name="author" content="Test Author" />
        </head>
        <body></body>
      </html>
    `;
    const result = await crawler.arun(`raw:${html}`);

    expect(result.metadata?.title).toBe('Test Page');
    expect(result.metadata?.author).toBe('Test Author');
    expect(result.metadata?.og?.title).toBe('OG Title');
    expect(result.metadata?.twitter?.card).toBe('summary');
  });

  it('should execute hooks', async () => {
    const onPageCreated = vi.fn();
    const onLoad = vi.fn();

    const html = '<html><body>Hooks Test</body></html>';
    const dataUrl = `data:text/html,${html}`;

    const result = await crawler.arun(dataUrl, {
      jsExecution: true,
      hooks: {
        onPageCreated: async (_: Page) => {
          onPageCreated();
        },
        onLoad: async (_: Page) => {
          onLoad();
        },
      },
    });

    expect(result.success).toBe(true);
    expect(onPageCreated).toHaveBeenCalled();
    expect(onLoad).toHaveBeenCalled();
  });
});
