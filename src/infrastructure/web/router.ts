import { NotFoundError } from "./errors/api-error";
import {
  handleDeleteIndex,
  handleIndexDocuments,
} from "./handlers/document-handlers";
import { handleHealthCheck } from "./handlers/health-handler";
import { handleListIndexes } from "./handlers/index-handlers";
import { handleSearch, handleSuggest } from "./handlers/search-handlers";

/**
 * Maps incoming requests to the appropriate handler based on path and method.
 */
export async function routeRequest(
  request: Request,
  url: URL
): Promise<Response> {
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const method = request.method;

  console.debug(`Routing: ${method} ${url.pathname}`); // More detailed log

  // --- Health Check ---
  if (url.pathname === "/" && method === "GET") {
    return handleHealthCheck(request);
  }

  // --- Index Operations ---
  if (pathSegments[0] === "indexes") {
    // List Indexes: GET /indexes
    if (pathSegments.length === 1 && method === "GET") {
      return handleListIndexes(request);
    }

    // Operations on a specific index: /indexes/{indexName}[/action]
    if (pathSegments.length >= 2) {
      const indexName = pathSegments[1];
      const action = pathSegments[2]; // e.g., 'search', 'suggest' or undefined

      // Index Documents: POST /indexes/{indexName}
      if (!action && method === "POST") {
        return handleIndexDocuments(request, indexName);
      }

      // Delete Index: DELETE /indexes/{indexName}
      if (!action && method === "DELETE") {
        return handleDeleteIndex(request, indexName);
      }

      // Search: GET or POST /indexes/{indexName}/search
      if (action === "search" && (method === "GET" || method === "POST")) {
        return handleSearch(request, indexName, url);
      }

      // Suggest: GET /indexes/{indexName}/suggest
      if (action === "suggest" && method === "GET") {
        return handleSuggest(request, indexName, url);
      }
    }
  }

  // --- Default: Not Found ---
  console.warn(`Route not found: ${method} ${url.pathname}`);
  throw new NotFoundError(
    `The requested resource was not found on this server.`
  );
}
