import type { Document } from "@/core/domain/document";
import type { IndexConfig } from "@/interfaces/search";
import { indexDocumentsUseCase } from "../di";
import { BadRequestError } from "../errors/api-error";
import { createJsonResponse } from "../utils";

export async function handleIndexDocuments(
  request: Request,
  indexName: string
): Promise<Response> {
  if (request.method !== "POST") {
    throw new BadRequestError("Method Not Allowed for indexing documents.");
  }
  try {
    const payload: { documents: Document[]; config: IndexConfig } =
      await request.json();
    if (!payload || !payload.documents || !payload.config) {
      throw new BadRequestError(
        'Invalid payload: "documents" and "config" fields are required.'
      );
    }
    // Add validation for config content if needed

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
    if (error instanceof SyntaxError) {
      // Bad JSON
      throw new BadRequestError("Invalid JSON payload.");
    }
    // Re-throw other errors (like validation errors from use case) to be caught by the main handler
    throw error;
  }
}

export async function handleDeleteIndex(
  request: Request,
  indexName: string
): Promise<Response> {
  if (request.method !== "DELETE") {
    throw new BadRequestError("Method Not Allowed for deleting an index.");
  }
  // Add confirmation logic or checks if needed
  await indexDocumentsUseCase.deleteIndex(indexName); // Use case handles provider deletion
  // Note: Need to implement deletion in InMemoryIndexRepository if persistence required it
  return createJsonResponse(
    { message: `Index "${indexName}" deleted successfully.` },
    200
  );
}
