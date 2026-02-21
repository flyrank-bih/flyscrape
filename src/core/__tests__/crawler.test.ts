import { Impit } from "impit";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AsyncWebCrawler } from "../crawler";

// Note: These tests require internet connection and may be slow.
// In a CI environment, we might want to mock the browser or network.
// For this implementation, we assume local execution.

const mockFetch = vi.fn();
const exampleHtml =
  '<html><head><title>Example Domain</title></head><body><h1>Example Domain</h1><a href="https://iana.org">IANA</a></body></html>';
const dataUrl = `data:text/html,${encodeURIComponent(exampleHtml)}`;

describe("AsyncWebCrawler", () => {
  let crawler: AsyncWebCrawler;

  beforeAll(async () => {
    vi.spyOn(Impit.prototype, "fetch").mockImplementation(mockFetch);
    crawler = new AsyncWebCrawler();
    await crawler.start();
  });

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      status: 200,
      text: async () => exampleHtml,
    });
  });

  afterAll(async () => {
    await crawler.close();
    vi.restoreAllMocks();
  });

  it("should crawl a simple page (fetch mode)", async () => {
    const result = await crawler.arun("https://mocked.example", {
      jsExecution: false,
    });

    expect(result.success).toBe(true);
    expect(result.html).toContain("Example Domain");
    expect(result.metadata?.title).toContain("Example Domain");
  }, 10000);

  it("should crawl a simple page (browser mode)", async () => {
    const result = await crawler.arun(dataUrl, {
      jsExecution: true,
    });

    expect(result.success).toBe(true);
    expect(result.html).toContain("Example Domain");
    expect(result.metadata?.title).toContain("Example Domain");
    expect(result.metadata?.screenshot).toBeUndefined(); // Not requested
  }, 30000);

  it("should take a screenshot", async () => {
    const result = await crawler.arun(dataUrl, {
      jsExecution: true,
      screenshot: true,
      bypassCache: true,
    });

    expect(result.success).toBe(true);
    expect(result.metadata?.screenshot).toBeDefined();
  }, 30000);

  it("should handle 404s", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 404,
      text: async () => "<html><body>Not Found</body></html>",
    });
    const result = await crawler.arun("https://mocked-404.com", {
      jsExecution: false,
    });
    // Note: Playwright might not throw on 404, but return the page.
    // The status code should be 404.

    expect(result.statusCode).toBe(404);
  }, 30000);

  it("should extract links", async () => {
    const result = await crawler.arun("https://mocked-links.com", {
      jsExecution: false,
    });
    expect(result.links).toBeDefined();
    expect(result.links?.length).toBeGreaterThan(0);
    expect(result.links?.[0]).toContain("iana.org");
  }, 30000);

  it("should generate markdown", async () => {
    const result = await crawler.arun("https://mocked-markdown.com", {
      jsExecution: false,
    });
    expect(result.markdown).toBeDefined();
    expect(result.markdown).toContain("Example Domain");
  }, 30000);
});
