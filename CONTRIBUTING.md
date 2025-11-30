# Contributing to FlyScrape

Thank you for considering contributing to FlyScrape! We welcome contributions from the community to make this project even better.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/flyscrape.git
    cd flyscrape
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```

## Development Workflow

1.  **Create a branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/my-new-feature
    ```
2.  **Make your changes**. Ensure you follow the existing code style and separation of concerns (SOC).
3.  **Run tests** to ensure nothing is broken:
    ```bash
    npm test
    ```
4.  **Format your code** using Biome:
    ```bash
    npm run format
    ```

## Project Structure

-   `src/core`: Core crawler logic and orchestration.
-   `src/extraction`: Data extraction strategies (CSS, LLM).
-   `src/processing`: Data processing (Markdown, Pruning, Chunking).
-   `src/stealth`: Browser stealth techniques.
-   `src/cache`: Caching mechanisms.
-   `src/utils`: Shared utility functions.

## Pull Requests

1.  Push your branch to your fork.
2.  Open a Pull Request (PR) against the `main` branch of the original repository.
3.  Provide a clear description of your changes and the problem they solve.
4.  Ensure all tests pass and the code is formatted.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
