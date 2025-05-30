import { NotFoundError } from "./errors/api-error";
import { handleGenerateConfig } from "./handlers/ai-handler";
import {
  handleAddDocument,
  handleDeleteDocument,
  handleDeleteIndex,
  handleGetDocument,
  handleIndexDocuments,
  handleUpdateDocument,
} from "./handlers/document-handlers";
import { handleHealthCheck } from "./handlers/health-handler";
import { handleListIndexes } from "./handlers/index-handlers";
import { handleSearch, handleSuggest } from "./handlers/search-handlers";
import {
  handleAddSynonyms,
  handleDeleteSynonym,
  handleListSynonyms,
} from "./handlers/synonym-handlers";
import { handleSystemStats } from "./handlers/system-handler";

/**
 * Maps incoming requests to the appropriate handler based on path and method.
 */
export async function routeRequest(
  request: Request,
  url: URL
): Promise<Response> {
  const method = request.method;

  console.debug(`Routing: ${method} ${url.pathname}`); // More detailed log

  // --- Health Check ---
  if (url.pathname === "/health" && method === "GET") {
    return handleHealthCheck(request);
  }

  if (url.pathname === "/system/stats" && method === "GET") {
    // Note: Authentication middleware already ran before this router function
    return handleSystemStats(request);
  }

  // --- AI Routes ---
  if (url.pathname === "/ai/generate-config" && method === "POST") {
    return handleGenerateConfig(request);
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  // --- Synonym Routes ---
  if (pathSegments[0] === "synonyms") {
    const word = pathSegments[1]; // Get word from path if present

    // List Synonyms: GET /synonyms
    if (!word && method === "GET") {
      return handleListSynonyms(request);
    }
    // Add Synonym Group: POST /synonyms
    if (!word && method === "POST") {
      return handleAddSynonyms(request);
    }
    // Delete Synonym: DELETE /synonyms/{word}
    if (word && method === "DELETE") {
      return handleDeleteSynonym(request, word);
    }
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

      if (action === "documents") {
        const documentId = pathSegments[3]; // Get ID from path if present

        // Add Document: POST /indexes/{indexName}/documents
        if (!documentId && method === "POST") {
          return handleAddDocument(request, indexName);
        }

        // Operations on specific document: /indexes/{indexName}/documents/{documentId}
        if (documentId) {
          if (method === "GET")
            return handleGetDocument(request, indexName, documentId);
          if (method === "PUT")
            return handleUpdateDocument(request, indexName, documentId);
          if (method === "DELETE")
            return handleDeleteDocument(request, indexName, documentId);
        }
      }
    }
  }

  // --- Default: Not Found ---
  console.warn(`Route not found: ${method} ${url.pathname}`);
  throw new NotFoundError(
    `The requested resource was not found on this server.`
  );
}
