# 👋 Contributing to FlyScrape

First off, thank you for considering contributing to FlyScrape! We value your time and effort, and we're excited to have you join our community. Whether you're fixing a bug, adding a new feature, or improving documentation, your help is appreciated.

---

## 📚 Table of Contents

- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Project Structure](#-project-structure)
- [Pull Request Process](#-pull-request-process)
- [Style Guide](#-style-guide)
- [Reporting Issues](#-reporting-issues)

---

## 🚀 Getting Started

### 1. Fork the Repository
Start by forking the [FlyScrape repository](https://github.com/flyrank-bih/flyscrape) to your GitHub account.

### 2. Clone Your Fork
Clone your forked repository to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/flyscrape.git
cd flyscrape
```

### 3. Install Dependencies
We use `bun` for dependency management. Install the required packages:

```bash
bun install
```

---

## 🛠️ Development Workflow

### 1. Create a Branch
Always work on a new branch for your changes. Use a descriptive name:

```bash
# For features
git checkout -b feature/amazing-new-feature

# For bug fixes
git checkout -b fix/nasty-bug
```

### 2. Make Your Changes
Implement your feature or fix. Keep your changes focused and minimal.
- Follow the **Single Responsibility Principle**.
- Write clear, self-documenting code.
- Add comments for complex logic.

### 3. Run Tests
Ensure that your changes don't break existing functionality. We use **Vitest** for testing.

```bash
# Run all tests
bun test

# Run tests in watch mode (useful during development)
bun run test:watch
```

### 4. Format & Lint
We maintain a consistent code style. Run the formatter before committing:

```bash
bun run format
```

---

## 📂 Project Structure

Understanding the codebase structure will help you navigate easily:

- **`src/core`**: The heart of FlyScrape. Contains the main crawler logic (`crawler.ts`) and orchestration.
- **`src/extraction`**: Strategies for extracting data (CSS selectors, LLM-based extraction).
- **`src/processing`**: Data processing modules, including Markdown generation, content pruning, and chunking.
- **`src/stealth`**: Browser stealth techniques to avoid detection (User-Agent rotation, fingerprinting).
- **`src/cache`**: Caching mechanisms (Memory, Disk) to optimize performance.
- **`src/utils`**: Shared utility functions (DOM manipulation, text processing).

---

## 📥 Pull Request Process

When you're ready to submit your changes:

1.  **Push** your branch to your fork:
    ```bash
    git push origin feature/amazing-new-feature
    ```
2.  **Open a Pull Request** against the `main` branch of the original `flyrank/flyscrape` repository.
3.  **Description**: Provide a clear and concise description of your changes. Explain *why* this change is necessary and *how* it solves the problem.
4.  **Link Issues**: If your PR fixes an issue, link it (e.g., `Fixes #123`).
5.  **Checklist**:
    - [ ] My code follows the project's style guidelines.
    - [ ] I have performed a self-review of my code.
    - [ ] I have added tests that prove my fix is effective or that my feature works.
    - [ ] New and existing unit tests pass locally.

---

## 🎨 Style Guide

- **TypeScript**: We use strict TypeScript. Avoid `any` unless absolutely necessary.
- **Naming**: Use `camelCase` for variables/functions and `PascalCase` for classes/interfaces.
- **Comments**: Write JSDoc comments for public APIs.

---

## 🐛 Reporting Issues

Found a bug? Great! (Well, not great that it's broken, but great that you found it).

1.  Check the [existing issues](https://github.com/flyrank-bih/flyscrape/issues) to see if it has already been reported.
2.  Open a new issue with a clear title and description.
3.  Include a **reproduction code snippet** or steps to reproduce the issue.
4.  Mention your OS, Node.js version, and FlyScrape version.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

Happy Coding! 🚀
