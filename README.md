# FlyScrape

<div align="center">

**The Ultimate Node.js Web Scraping & Crawling Engine**

[![npm version](https://img.shields.io/npm/v/@flyrank/flyscrape.svg?style=flat-square)](https://www.npmjs.com/package/@flyrank/flyscrape)
[![License](https://img.shields.io/npm/l/@flyrank/flyscrape.svg?style=flat-square)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@flyrank/flyscrape.svg?style=flat-square)](https://www.npmjs.com/package/@flyrank/flyscrape)

</div>

**FlyScrape** is a production-grade, modular web scraping library designed for the modern web. Built on top of Playwright, it combines the reliability of headless browser automation with advanced stealth techniques, AI-powered content extraction, and efficient caching strategies.

Whether you're building a data pipeline, an AI agent, or a content aggregator, FlyScrape provides the tools to extract clean, structured data from any website.

---

## 🚀 Key Features

- **🕷️ Advanced Crawling Engine**: Leverages Playwright for full JavaScript execution, handling complex SPAs and dynamic content with ease.
- **👻 Stealth & Anti-Blocking**: Integrated evasion techniques (user-agent rotation, fingerprinting protection, human-like behavior) to bypass WAFs and bot detection.
- **🧠 AI-Powered Extraction**: Seamlessly integrate with OpenAI and other LLMs to extract structured JSON data from unstructured pages.
- **🧹 Smart Content Cleaning**:
  - **Content-Only Mode**: Automatically strips navigation, ads, footers, and boilerplate.
  - **AI Optimization**: Use LLMs to refine extraction for perfect accuracy.
  - **Media Filtering**: Option to include or exclude images/videos.
- **📝 LLM-Ready Markdown**: Converts HTML to clean, semantic Markdown, optimized for RAG (Retrieval-Augmented Generation) pipelines.
- **⚡ High Performance**:
  - **Hybrid Caching**: Memory and disk-based caching to speed up redundant crawls.
  - **Resource Blocking**: Block unnecessary assets (images, css, fonts) for faster loading.
- **🧩 Developer Experience**: Written in TypeScript with a modular architecture for easy extensibility.

## 📦 Installation

```bash
npm install @flyrank/flyscrape
# or
yarn add @flyrank/flyscrape
# or
pnpm add @flyrank/flyscrape
```

## ⚡ Quick Start

### Basic Crawl

```typescript
import { AsyncWebCrawler } from "@flyrank/flyscrape";

async function main() {
  const crawler = new AsyncWebCrawler();
  await crawler.start();
  
  // Crawl a URL and get clean Markdown
  const result = await crawler.arun("https://example.com");
  
  if (result.success) {
    console.log(result.markdown);
  }
  
  await crawler.close();
}

main();
```

### Content-Only Mode (Smart Cleaning)

Extract only the main article content, removing all UI clutter.

```typescript
const result = await crawler.arun("https://blog.example.com/guide", {
  contentOnly: true,
  excludeMedia: true, // Remove images/videos
});
```

### AI-Optimized Extraction

For the highest precision, use OpenAI to perfect the content extraction.

```typescript
const result = await crawler.arun("https://complex-site.com/article", {
  contentOnly: true,
  optimizeWithAI: true,
  // Ensure process.env.OPENAI_API_KEY is set
});
```

## 🛠️ Advanced Usage

### Structured Data Extraction (LLM)

Define a schema and let the LLM do the work.

```typescript
const schema = {
  type: "object",
  properties: {
    title: { type: "string" },
    price: { type: "number" },
    features: { type: "array", items: { type: "string" } }
  }
};

const result = await crawler.arun("https://store.example.com/product/123", {
  extraction: {
    type: "llm",
    schema: schema,
    provider: myOpenAIProvider // Your LLM provider instance
  }
});
```

### Stealth Configuration

FlyScrape enables stealth mode by default. You can customize it in the config.

```typescript
const crawler = new AsyncWebCrawler({
  stealth: true,
  headless: true,
  // Custom headers, proxy, etc.
});
```

## 🤝 Contributing

We love contributions! FlyScrape is an open-source project, and we welcome help to make it better.

1.  **Fork** the repository.
2.  **Clone** your fork: `git clone https://github.com/your-username/flyscrape.git`
3.  **Create a branch**: `git checkout -b feature/amazing-feature`
4.  **Commit** your changes.
5.  **Push** to your branch.
6.  **Open a Pull Request**.

Please ensure your code follows the existing style and includes tests where appropriate.

## 💬 Support & Community

-   **Issues**: Encountered a bug? Open an issue on [GitHub](https://github.com/flyrank/flyscrape/issues).
-   **Discussions**: Have ideas or questions? Join the [GitHub Discussions](https://github.com/flyrank/flyscrape/discussions).

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/flyrank">FlyRank</a>
</div>
