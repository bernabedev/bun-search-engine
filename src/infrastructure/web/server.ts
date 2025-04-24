import { type Document } from "@/core/domain/document";
import { IndexDocumentsUseCase } from "@/core/use-cases/index-documents-use-case";
import { SearchUseCase } from "@/core/use-cases/search-use-case";
import { SuggestUseCase } from "@/core/use-cases/suggest-use-case";
import { InMemoryIndexRepository } from "@/infrastructure/persistence/in-memory-index-repository";
import { MiniSearchProvider } from "@/infrastructure/search/mini-search-provider";
import type {
  IndexConfig,
  SearchParams,
  SuggestParams,
} from "@/interfaces/search";
import { file } from "bun";
import {
  ApiError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "./errors/api-error";

// --- Environment Variable Setup ---
const ExpectedApiKey = process.env.SEARCH_API_KEY;

if (!ExpectedApiKey) {
  console.error("FATAL ERROR: SEARCH_API_KEY environment variable is not set.");
  console.error(
    "The search engine cannot start without an API key for security."
  );
  console.error(
    "Please set the SEARCH_API_KEY environment variable and restart."
  );
  process.exit(1); // Exit if the API key is missing
} else {
  console.log("SEARCH_API_KEY loaded successfully.");
}

// --- Dependency Injection Setup ---
const indexRepository = new InMemoryIndexRepository();
const searchProvider = new MiniSearchProvider();

const indexDocumentsUseCase = new IndexDocumentsUseCase(
  indexRepository,
  searchProvider
);
const searchUseCase = new SearchUseCase(searchProvider, indexRepository);
const suggestUseCase = new SuggestUseCase(searchProvider, indexRepository);

// --- Helper Functions ---
function createJsonResponse(
  data: any,
  status = 200,
  headers?: HeadersInit
): Response {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(headers || {}),
    },
  });
}

function createErrorResponse(error: unknown): Response {
  let message = "Internal Server Error";
  let statusCode = 500;

  if (error instanceof ApiError) {
    message = error.message;
    statusCode = error.statusCode;
  } else if (error instanceof Error) {
    message = error.message; // Use the actual error message
    // Log the full error for debugging
    console.error("Unhandled Error:", error);
  } else {
    // Handle non-Error objects thrown
    console.error("Unknown error object:", error);
  }

  return createJsonResponse({ error: { message, statusCode } }, statusCode);
}

// --- Authorization Middleware Logic ---
function authenticateRequest(request: Request, url: URL): void {
  // Allow public access to the health check endpoint
  if (url.pathname === "/" && request.method === "GET") {
    return; // Skip authentication for health check
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      'Missing or malformed Authorization header. Use "Bearer YOUR_API_KEY".'
    );
  }

  const providedKey = authHeader.substring(7); // Remove "Bearer " prefix

  if (providedKey !== ExpectedApiKey) {
    throw new UnauthorizedError("Invalid API Key.");
  }

  // If we reach here, the key is valid
  console.log("API Key authenticated successfully.");
}

// --- Request Handling Logic ---

async function handleIndexRequest(
  request: Request,
  indexName: string
): Promise<Response> {
  if (request.method !== "POST")
    throw new BadRequestError("Method Not Allowed");

  try {
    const payload: { documents: Document[]; config: IndexConfig } =
      await request.json();
    if (!payload || !payload.documents || !payload.config) {
      throw new BadRequestError(
        'Invalid payload: "documents" and "config" fields are required.'
      );
    }

    const result = await indexDocumentsUseCase.execute(
      indexName,
      payload.documents,
      payload.config
    );
    return createJsonResponse(
      {
        message: `Successfully indexed ${result.count} documents into index "${indexName}".`,
      },
      201
    );
  } catch (error) {
    // Catch specific errors if needed, e.g., validation errors
    if (error instanceof SyntaxError) {
      // Bad JSON
      throw new BadRequestError("Invalid JSON payload.");
    }
    throw error; // Re-throw other errors to be caught by the main handler
  }
}

async function handleSearchRequest(
  request: Request,
  indexName: string,
  url: URL
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST")
    throw new BadRequestError("Method Not Allowed"); // Allow POST for complex queries

  let params: SearchParams;

  if (request.method === "GET") {
    const query = url.searchParams.get("query");
    if (!query)
      throw new BadRequestError("Missing required query parameter: query");

    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    // Basic filter parsing (e.g., filter[genre]=Action&filter[year]=1994)
    const filter: Record<string, any> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("filter[")) {
        const filterKey = key.substring(7, key.length - 1); // Extract key between brackets
        // Basic type inference (can be more robust)
        if (!isNaN(Number(value))) {
          filter[filterKey] = Number(value);
        } else if (
          value.toLowerCase() === "true" ||
          value.toLowerCase() === "false"
        ) {
          filter[filterKey] = value.toLowerCase() === "true";
        } else {
          filter[filterKey] = value;
        }
      }
    }

    params = {
      query,
      offset: isNaN(offset) ? 0 : offset,
      limit: isNaN(limit) ? 10 : limit,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      // sortBy: url.searchParams.getAll('sortBy') || undefined // Basic sort support
    };
  } else {
    // POST request
    try {
      const body = await request.json();
      if (!body.query)
        throw new BadRequestError("Missing required field in body: query");
      params = {
        query: body.query,
        offset: body.offset ?? 0,
        limit: body.limit ?? 10,
        filter: body.filter,
        sortBy: body.sortBy,
      };
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON payload for POST search.");
      throw error;
    }
  }

  const results = await searchUseCase.execute(indexName, params);
  return createJsonResponse(results);
}

async function handleSuggestRequest(
  request: Request,
  indexName: string,
  url: URL
): Promise<Response> {
  if (request.method !== "GET") throw new BadRequestError("Method Not Allowed");

  const query = url.searchParams.get("query");
  if (!query)
    throw new BadRequestError("Missing required query parameter: query");

  const limit = parseInt(url.searchParams.get("limit") || "5", 10);
  // Basic filter parsing (similar to search)
  const filter: Record<string, any> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith("filter[")) {
      const filterKey = key.substring(7, key.length - 1);
      if (!isNaN(Number(value))) filter[filterKey] = Number(value);
      else if (
        value.toLowerCase() === "true" ||
        value.toLowerCase() === "false"
      )
        filter[filterKey] = value.toLowerCase() === "true";
      else filter[filterKey] = value;
    }
  }

  const params: SuggestParams = {
    query,
    limit: isNaN(limit) ? 5 : limit,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  };

  const results = await suggestUseCase.execute(indexName, params);
  return createJsonResponse(results);
}

async function handleListIndexesRequest(request: Request): Promise<Response> {
  if (request.method !== "GET") throw new BadRequestError("Method Not Allowed");
  const indexNames = await indexRepository.listIndexes();
  const configs = await Promise.all(
    indexNames.map((name) =>
      indexRepository.getIndexConfig(name).then((config) => ({ name, config }))
    )
  );
  return createJsonResponse(configs);
}

// --- Main Server Logic ---
console.log("Starting Bun Search Engine Server...");

const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean); // Filter empty segments

    try {
      console.log(
        `[${new Date().toISOString()}] ${request.method} ${url.pathname}${
          url.search
        }`
      );

      // --- Authentication Middleware ---
      authenticateRequest(request, url);

      // --- Routing ---
      if (pathSegments[0] === "indexes") {
        if (pathSegments.length === 1 && request.method === "GET") {
          // GET /indexes - List all indexes and their configs
          return await handleListIndexesRequest(request);
        }
        if (pathSegments.length >= 2) {
          const indexName = pathSegments[1];
          const action = pathSegments[2]; // e.g., 'search', 'suggest'

          if (!action && request.method === "POST") {
            // POST /indexes/{indexName} - Index documents
            return await handleIndexRequest(request, indexName);
          }
          if (action === "search") {
            // GET or POST /indexes/{indexName}/search
            return await handleSearchRequest(request, indexName, url);
          }
          if (action === "suggest") {
            // GET /indexes/{indexName}/suggest
            return await handleSuggestRequest(request, indexName, url);
          }
          if (!action && request.method === "DELETE") {
            // DELETE /indexes/{indexName} - Delete an index
            await indexDocumentsUseCase.deleteIndex(indexName);
            return createJsonResponse(
              { message: `Index "${indexName}" deleted successfully.` },
              200
            );
          }
        }
      }

      // --- Basic Health Check / Root ---
      if (url.pathname === "/" && request.method === "GET") {
        return createJsonResponse({
          status: "ok",
          message: "Bun Search Engine is running!",
        });
      }

      // --- Default: Not Found ---
      throw new NotFoundError(
        `Route not found: ${request.method} ${url.pathname}`
      );
    } catch (error) {
      return createErrorResponse(error);
    }
  },
  error(error: Error): Response {
    // Bun's top-level error handler
    console.error("Server Error:", error);
    return createErrorResponse(error);
  },
});

console.log(`🚀 Server listening on http://localhost:${server.port}`);

// --- Graceful Shutdown ---
process.on("SIGINT", () => {
  console.log("\nGracefully shutting down...");
  server.stop(true); // true = wait for connections to close
  // Add any cleanup logic here (e.g., persisting in-memory data if needed)
  console.log("Server stopped.");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  server.stop(true);
  console.log("Server stopped.");
  process.exit(0);
});

// Load initial data on startup (optional)
async function loadInitialData() {
  try {
    console.log("Loading initial data...");
    const moviesPath = "./data/movies.json"; // Relative to project root
    const moviesFile = file(moviesPath);
    if (await moviesFile.exists()) {
      const moviesData: Document[] = await moviesFile.json();
      const movieConfig: IndexConfig = {
        fields: ["title", "genre"], // Fields to search
        storeFields: ["id", "title", "genre", "year", "rating"], // Fields to return
        idField: "id",
      };
      await indexDocumentsUseCase.execute("movies", moviesData, movieConfig);
      console.log(
        `Successfully loaded and indexed ${moviesData.length} movies into 'movies' index.`
      );
    } else {
      console.warn(`Initial data file not found: ${moviesPath}`);
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
  }
}

// Load data after the server starts listening
loadInitialData();
