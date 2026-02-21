import { Impit } from "impit";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { CSSSchema } from "../../extraction/interfaces";
import { AsyncWebCrawler } from "../crawler";

const mockFetch = vi.fn();

describe("AsyncWebCrawler Advanced Features", () => {
  let crawler: AsyncWebCrawler;
  const html = `
    <html>
      <body>
        <h1>Article Title</h1>
        <div class="content">
          <p>Main content paragraph.</p>
          <a href="https://example.com">Link 1</a>
          <span>$100.00</span>
        </div>
        <div class="sidebar">
          <p>Ad content</p>
        </div>
      </body>
    </html>
  `;
  const dataUrl = `data:text/html,${encodeURIComponent(html)}`;

  beforeAll(async () => {
    vi.spyOn(Impit.prototype, "fetch").mockImplementation(mockFetch);
    // Default success response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    crawler = new AsyncWebCrawler(
      { headless: true, stealth: true }, // Enable stealth
      { cacheEnabled: false },
    );
    await crawler.start();
  });

  afterAll(async () => {
    await crawler.close();
    vi.restoreAllMocks();
  });

  it("should launch with stealth mode enabled", async () => {
    const result = await crawler.arun(dataUrl, {
      jsExecution: true,
      magic: true,
    });

    expect(result.success).toBe(true);
  });

  it("should extract data using CSS schema (fetch mode)", async () => {
    const html = `
      <html>
        <body>
          <h1>Article Title</h1>
          <div class="author">By <span>John Doe</span></div>
          <ul class="tags">
            <li><a href="/tag/tech">Tech</a></li>
            <li><a href="/tag/news">News</a></li>
          </ul>
        </body>
      </html>
    `;

    // Mock fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const schema: CSSSchema = {
      title: "h1",
      author: {
        selector: ".author span",
      },
      tags: {
        selector: ".tags li a",
        list: true,
      },
    };

    const result = await crawler.arun("https://mocked-article.com", {
      jsExecution: false,
      extraction: {
        type: "css",
        schema,
      },
    });

    expect(result.success).toBe(true);
    expect(result.extractedContent).toBeDefined();
    expect(result.extractedContent.title).toBe("Article Title");
    expect(result.extractedContent.author).toBe("John Doe");
    expect(result.extractedContent.tags).toEqual(["Tech", "News"]);

    mockFetch.mockClear();
  });

  it("should generate markdown with citations", async () => {
    const html = `
      <p>This is a <a href="https://example.com">link</a>.</p>
    `;

    // Mock fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const result = await crawler.arun("https://mocked-citations.com", {
      jsExecution: false,
      processing: {
        markdown: {
          enableCitations: true,
        },
      },
    });

    expect(result.markdown).toContain("[1]");
    expect(result.markdown).toContain("https://example.com");

    mockFetch.mockClear();
  });

  it("should prune content using BM25", async () => {
    const html = `
      <p>Apple is a technology company.</p>
      <p>Banana is a fruit.</p>
      <p>Apple creates the iPhone.</p>
    `;

    // Mock fetch
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const result = await crawler.arun("https://mocked-pruning.com", {
      jsExecution: false,
      processing: {
        pruning: {
          query: "technology company",
          threshold: 0.1, // Low threshold for testing
        },
      },
    });

    expect(result.filteredContent).toBeDefined();
    // The chunk about Apple technology should be ranked highest
    expect(result.filteredContent[0].content).toContain(
      "Apple is a technology company",
    );

    mockFetch.mockClear();
  });
});
