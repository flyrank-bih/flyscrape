![image](https://i.imgur.com/nobwcP8.png)
<hr/>
<div align="center">

**The Ultimate Node.js Web Scraping & Crawling Engine**

[![npm version](https://img.shields.io/npm/v/@flyrank/flyscrape.svg?style=flat-square)](https://www.npmjs.com/package/@flyrank/flyscrape)
[![License](https://img.shields.io/npm/l/@flyrank/flyscrape.svg?style=flat-square)](LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@flyrank/flyscrape.svg?style=flat-square)](https://www.npmjs.com/package/@flyrank/flyscrape)
[![GitHub Stars](https://img.shields.io/github/stars/flyrank/flyscrape?style=social)](https://github.com/flyrank-bih/flyscrape/stargazers)

</div>

**FlyScrape** is a Node.js package, based on top of Crawl4AI, that makes it easy to integrate powerful scrapers and crawlers directly into your web applications. Designed for the modern web, it provides modular, production-ready tools to extract clean, structured data, ready for RAG pipelines, AI agents, or advanced analytics.

Whether you’re building a content aggregator, an AI agent, or a complex data pipeline, FlyScrape simplifies web crawling and scraping while giving you maximum flexibility and performance.

<details>
  <summary>🤔 <strong>Why Developers Pick FlyScrape</strong></summary>

- **LLM-Ready Output**: Generates smart Markdown with headings, tables, code blocks, and citation hints optimized for RAG.
- **Production Grade**: Built for reliability with retry strategies, caching, and robust error handling.
- **Full Control**: Customize every aspect of the crawl with hooks, custom transformers, and flexible configurations.
- **Anti-Blocking**: Integrated stealth techniques to bypass WAFs and bot detection systems.
- **Developer Experience**: Fully typed in TypeScript with a modular architecture for easy extensibility.

</details>

## 🚀 Quick Start

### 1. Installation

```bash
npm install @flyrank/flyscrape
# or
yarn add @flyrank/flyscrape
# or
pnpm add @flyrank/flyscrape
```

### 2. Basic Crawl

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

### 3. Content-Only Mode (Smart Cleaning)

Extract only the main article content, removing all UI clutter.

```typescript
const result = await crawler.arun("https://blog.example.com/guide", {
  contentOnly: true,
  excludeMedia: true, // Remove images/videos
});
```

## ✨ Features

<details>
<summary>📝 <strong>Markdown Generation</strong></summary>

- 🧹 **Clean Markdown**: Generates clean, structured Markdown with accurate formatting.
- 🎯 **Fit Markdown**: Heuristic-based filtering to remove noise and irrelevant parts for AI-friendly processing.
- 🔗 **Citations and References**: Converts page links into a numbered reference list with clean citations.
- 🛠️ **Custom Strategies**: Users can create their own Markdown generation strategies tailored to specific needs.
- 📚 **BM25 Algorithm**: Employs BM25-based filtering for extracting core information and removing irrelevant content. 

</details>

<details>
<summary>🔎 <strong>Crawling & Scraping</strong></summary>

- 🖼️ **Media Support**: Extract images, audio, videos, and responsive image formats like `srcset` and `picture`.
- 🚀 **Dynamic Crawling**: Execute JS and wait for async or sync for dynamic content extraction.
- 📸 **Screenshots**: Capture page screenshots during crawling for debugging or analysis.
- 📂 **Raw Data Crawling**: Directly process raw HTML (`raw:`) or local files (`file://`).
- 🔗 **Comprehensive Link Extraction**: Extracts internal, external links, and embedded iframe content.
- 🛠️ **Customizable Hooks**: Define hooks at every step to customize crawling behavior (supports both string and function-based APIs).
- 💾 **Caching**: Cache data for improved speed and to avoid redundant fetches.
- 📄 **Metadata Extraction**: Retrieve structured metadata (OpenGraph, Twitter Cards) from web pages.
- 📡 **IFrame Content Extraction**: Seamless extraction from embedded iframe content.
- 🕵️ **Lazy Load Handling**: Waits for images to fully load, ensuring no content is missed due to lazy loading.
- 🔄 **Full-Page Scanning**: Simulates scrolling to load and capture all dynamic content, perfect for infinite scroll pages.

</details>

<details>
<summary>📊 <strong>Structured Data & AI</strong></summary>

- 🧠 **AI-Powered Extraction**: Seamlessly integrate with OpenAI and other LLMs to extract structured JSON data.
- 🧹 **Smart Content Cleaning**: Automatically strips navigation, ads, footers, and boilerplate.
- 📝 **LLM-Ready Markdown**: Converts HTML to clean, semantic Markdown, optimized for RAG (Retrieval-Augmented Generation) pipelines.

</details>

<details>
<summary>🕶️ <strong>Stealth & Performance</strong></summary>

- **👻 Stealth Mode**: Integrated evasion techniques (user-agent rotation, fingerprinting protection) to bypass WAFs.
- **⚡ Hybrid Caching**: Memory and disk-based caching to speed up redundant crawls.
- **🚫 Resource Blocking**: Block unnecessary assets (images, css, fonts) for faster loading.

</details>

## 🔬 Advanced Usage Examples

<details>
<summary>🔄 <strong>Session Persistence (Anti-Detection)</strong></summary>

Keep your session alive across multiple requests to look like a real user and avoid being blocked.

```typescript
const sessionId = 'my-session-1';

// First request: Creates session, saves cookies/local storage
await crawler.arun("https://example.com/login", { 
  session_id: sessionId 
});

// Second request: Reuses the same session (cookies are preserved!)
await crawler.arun("https://example.com/dashboard", { 
  session_id: sessionId 
});

// Clean up when done
await crawler.closeSession(sessionId);
```

</details>

<details>
<summary>⚡ <strong>TLS Client / Fast Mode</strong></summary>

Use `impit` under the hood to mimic real browser TLS fingerprints without the overhead of a full browser.

```typescript
// Fast mode (no browser, but stealthy TLS fingerprint)
const result = await crawler.arun("https://example.com", {
  jsExecution: false // Disables Playwright, enables impit
});
```

</details>

<details>
<summary>� <strong>Stealth Mode</strong></summary>

Enable advanced anti-detection features to bypass WAFs and bot detection systems.

```typescript
const crawler = new AsyncWebCrawler({
  stealth: true, // Enable stealth mode
  headless: true,
});

await crawler.start();
```

</details>

<details>
<summary>�🛠️ <strong>Custom Markdown Strategies</strong></summary>

Need full control? Provide a `customTransformer` to define exactly how HTML maps to Markdown.

```typescript
const result = await crawler.arun("https://example.com", {
  processing: {
    markdown: {
      customTransformer: (html) => {
        // Your custom logic here
        return myCustomConverter(html);
      }
    }
  }
});
```

</details>

<details>
<summary>🔄 <strong>Dynamic Content & Infinite Scroll</strong></summary>

Handle modern SPAs with ease using built-in scrolling and wait strategies.

```typescript
const result = await crawler.arun("https://infinite-scroll.com", {
  autoScroll: true, // Automatically scroll to bottom
  waitMode: 'networkidle', // Wait for network to settle
});
```

</details>

<details>
<summary>🛠️ <strong>Lifecycle Hooks</strong></summary>

Inject custom logic at key stages of the crawling process.

```typescript
const result = await crawler.arun("https://example.com", {
  hooks: {
    onPageCreated: async (page) => {
      // Set cookies or modify environment
      await page.context().addCookies([...]);
    },
    onLoad: async (page) => {
      // Interact with the page
      await page.click('#accept-cookies'); 
    }
  }
});
```

</details>

<details>
<summary>📂 <strong>Raw HTML & Local Files</strong></summary>

Process raw HTML or local files directly without a web server.

```typescript
// Raw HTML
await crawler.arun("raw:<html><body><h1>Hello</h1></body></html>");

// Local File
await crawler.arun("file:///path/to/local/file.html");
```

</details>

<details>
<summary>🧠 <strong>Structured Data Extraction (LLM)</strong></summary>

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

</details>

## 🤝 Contributing

We welcome contributions! Please see our [Contribution Guidelines](CONTRIBUTING.md) for details on how to get started.


## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/flyrank-bih">FlyRank</a>
</div>
