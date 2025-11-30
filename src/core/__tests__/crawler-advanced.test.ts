import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { CSSSchema } from "../../extraction/interfaces";
import { AsyncWebCrawler } from "../crawler";

describe("AsyncWebCrawler Advanced Features", () => {
  let crawler: AsyncWebCrawler;

  beforeAll(async () => {
    crawler = new AsyncWebCrawler(
      { headless: true, stealth: true }, // Enable stealth
      { cacheEnabled: false }
    );
    await crawler.start();
  });

  afterAll(async () => {
    await crawler.close();
  });

  it("should launch with stealth mode enabled", async () => {
    const result = await crawler.arun("https://example.com", {
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
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    } as Response);

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

    fetchSpy.mockRestore();
  });

  it("should generate markdown with citations", async () => {
    const html = `
      <p>This is a <a href="https://example.com">link</a>.</p>
    `;

    // Mock fetch
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    } as Response);

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

    fetchSpy.mockRestore();
  });

  it("should prune content using BM25", async () => {
    const html = `
      <p>Apple is a technology company.</p>
      <p>Banana is a fruit.</p>
      <p>Apple creates the iPhone.</p>
    `;

    // Mock fetch
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    } as Response);

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
      "Apple is a technology company"
    );

    fetchSpy.mockRestore();
  });
});
