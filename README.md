# Bunflare

A high-performance, in-memory search engine built with Bun.js, TypeScript, and MiniSearch, following Clean Architecture principles. This project aims to provide a foundational search service with features common in modern search solutions like Algolia, TypeSense, or MeiliSearch.

## Features

- **Full-Text Search:** Fast and efficient text search using MiniSearch.
- **Filtering:** Basic support for filtering results based on specific field values.
- **Pagination:** Offset and limit parameters for paginating search results.
- **Sorting:** Primarily based on relevance score (default MiniSearch behavior). Custom sorting logic can be added.
- **Autocomplete / Suggestions:** Provides type-ahead search suggestions.
- **Index Management:** Create, update, list, and delete search indexes.
- **Standard API Response:** Uses a response structure similar to popular search services.
- **Built with Bun.js & TypeScript:** Leverages Bun's speed and TypeScript's type safety.
- **Clean Architecture:** Organized codebase for maintainability and testability.
- **In-Memory:** Uses MiniSearch for in-memory indexing and searching (data is lost on server restart unless persisted externally or reloaded).

## Technology Stack

- **Runtime:** [Bun.js](https://bun.sh/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Search Library:** [MiniSearch](https://github.com/lucaong/minisearch)

## Project Structure

The project follows Clean Architecture principles:

<!-- src/
├── core/ # Core business logic, independent of frameworks
│ ├── domain/ # Entities and value objects (e.g., Document)
│ ├── ports/ # Interfaces for external dependencies (repositories, search providers)
│ └── use-cases/ # Application-specific logic orchestrating domain objects and ports
├── infrastructure/ # Implementation details (frameworks, libraries, drivers)
│ ├── persistence/ # Data storage implementations (e.g., InMemoryIndexRepository)
│ ├── search/ # Search provider implementations (e.g., MiniSearchProvider)
│ └── web/ # Web server setup, routing, controllers (e.g., Bun HTTP server)
├── interfaces/ # Shared data structures, particularly for API requests/responses
└── index.ts # Main application entry point -->

## Getting Started

### Prerequisites

- [Bun.js](https://bun.sh/docs/installation) installed (v1.0 or later recommended).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/bernabedev/bunflare.git
    cd bunflare
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  **Create a `.env` file** in the root directory and set the `SEARCH_API_KEY` variable (see Security section).

## Security

This search engine requires API Key authentication for all endpoints except the root health check (`/`).

**Setup:**

1.  Create a `.env` file in the project root.
2.  Add the following line, replacing the value with a strong, secret key:
    ```dotenv
    SEARCH_API_KEY=your-super-secret-and-strong-api-key
    ```
3.  Ensure `.env` is added to your `.gitignore` file.
4.  The server will read this key on startup. If the `SEARCH_API_KEY` environment variable is not set, the server will refuse to start.

**Usage:**

All API requests (except `GET /`) must include an `Authorization` header with the key using the `Bearer` scheme:

### Running the Application

- **Development Mode (with hot-reloading):**

  ```bash
  bun run dev
  ```

  The server will automatically restart when you make changes to the source files.

- **Production Mode:**
  ```bash
  bun run start
  ```

The server will start, typically on `http://localhost:3000`. The initial `movies.json` data will be loaded into the `movies` index automatically on startup if the file exists.

## API Endpoints

Base URL: `http://localhost:3000`
**Authentication:** All endpoints require `Authorization: Bearer <YOUR_API_KEY>` header, except `GET /`.

### Indexes

- **`POST /indexes/{indexName}`**: Create or update an index.

  - **Example:**
    ```bash
    API_KEY="your-super-secret-and-strong-api-key"
    curl -X POST http://localhost:3000/indexes/products \
         -H "Authorization: Bearer $API_KEY" \
         -H "Content-Type: application/json" \
         -d '{"config": {...}, "documents": [...] }'
    ```

- **`GET /indexes`**: List all available indexes.

  - **Example:**
    ```bash
    API_KEY="your-super-secret-and-strong-api-key"
    curl -H "Authorization: Bearer $API_KEY" http://localhost:3000/indexes
    ```

- **`DELETE /indexes/{indexName}`**: Delete an index.
  - **Example:**
    ```bash
    API_KEY="your-super-secret-and-strong-api-key"
    curl -X DELETE -H "Authorization: Bearer $API_KEY" http://localhost:3000/indexes/products
    ```

### Search

- **`GET /indexes/{indexName}/search`**: Perform a search query.

  - **Example:**
    ```bash
    API_KEY="your-super-secret-and-strong-api-key"
    curl -G -H "Authorization: Bearer $API_KEY" \
         http://localhost:3000/indexes/movies/search \
         --data-urlencode "query=action movie" \
         --data-urlencode "limit=5" \
         --data-urlencode "filter[year]=2008"
    ```

- **`POST /indexes/{indexName}/search`**: Perform a search query via POST.
  - **Example:**
    ```bash
    API_KEY="your-super-secret-and-strong-api-key"
    curl -X POST http://localhost:3000/indexes/movies/search \
         -H "Authorization: Bearer $API_KEY" \
         -H "Content-Type: application/json" \
         -d '{"query": "sci-fi", "filter": {"year": 1999}}'
    ```

### Suggestions / Autocomplete

- **`GET /indexes/{indexName}/suggest`**: Get search term suggestions.
  - **Example:**
    ```bash
    API_KEY="your-super-secret-and-strong-api-key"
    curl -G -H "Authorization: Bearer $API_KEY" \
         http://localhost:3000/indexes/movies/suggest \
         --data-urlencode "query=shaw"
    ```

### Health Check

- **`GET /`**: Check if the server is running.
  - **Example:** `curl http://localhost:3000/`

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
