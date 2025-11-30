# FlyScrape

**FlyScrape** is a powerful, modular, and AI-ready web scraping and crawling library for Node.js. Built with performance and flexibility in mind, it leverages Playwright for reliable rendering, supports stealth mode to evade detection, and integrates seamlessly with LLMs for structured data extraction.

**Inspiration**: This project is heavily inspired by the amazing [crawl4ai](https://github.com/unclecode/crawl4ai) library. We aim to bring similar powerful capabilities to the Node.js ecosystem with a focus on modularity and developer experience.

## Features

-   **🕷️ Advanced Crawling**: Built on Playwright for full JavaScript support and modern web compatibility.
-   **👻 Stealth Mode**: Integrated stealth techniques to evade bot detection and anti-scraping measures.
-   **🧠 LLM Extraction**: Extract structured data using Large Language Models (LLMs) with simple schema definitions.
-   **📝 Markdown Generation**: Convert web pages to clean, LLM-friendly markdown with citation support.
-   **🧹 Content Pruning**: Smart content filtering and pruning using BM25 and semantic similarity algorithms.
-   **📦 Caching**: Built-in caching to optimize performance and reduce redundant requests.
-   **🧩 Modular Architecture**: Designed with strict Separation of Concerns (SOC) for easy extensibility and maintenance.

## Installation

```bash
npm install @flyrank/flyscrape
```

## Usage

### Basic Crawling

```typescript
import { AsyncWebCrawler } from "@flyrank/flyscrape";

async function main() {
  const crawler = new AsyncWebCrawler();
  await crawler.start();

  const result = await crawler.arun("https://example.com");
  console.log(result.markdown);

  await crawler.close();
}

main();
```

### Extraction with CSS Selectors

```typescript
import { AsyncWebCrawler } from "@flyrank/flyscrape";

async function main() {
  const crawler = new AsyncWebCrawler();
  await crawler.start();

  const schema = {
    articles: {
      selector: "article",
      list: true,
      // nested schema configuration...
    }
  };

  const result = await crawler.arun("https://news.ycombinator.com", {
    extraction: {
      type: "css",
      schema: schema
    }
  });

  console.log(result.extractedContent);
  await crawler.close();
}
```

### LLM Extraction

```typescript
import { AsyncWebCrawler } from "@flyrank/flyscrape";

// Define your LLM provider (e.g., OpenAI wrapper)
const myLLMProvider = {
    generate: async (prompt) => { /* call OpenAI API */ return "{}"; }
};

async function main() {
  const crawler = new AsyncWebCrawler();
  await crawler.start();

  const schema = {
    type: "object",
    properties: {
      title: { type: "string" },
      summary: { type: "string" }
    }
  };

  const result = await crawler.arun("https://example.com", {
    extraction: {
      type: "llm",
      schema: schema,
      provider: myLLMProvider
    }
  });

  console.log(result.extractedContent);
  await crawler.close();
}
```

### Stealth Mode

FlyScrape automatically uses stealth techniques when initialized. You can customize browser behavior via configuration.

## Documentation

For more detailed documentation, please refer to the source code and examples in the repository.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the MIT License.

## Credits

Special thanks to the [crawl4ai](https://github.com/unclecode/crawl4ai) team for their innovative work in the Python ecosystem, which served as a major inspiration for this project.
