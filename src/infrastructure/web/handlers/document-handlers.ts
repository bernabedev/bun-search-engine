import type { Document } from "@/core/domain/document";
import type { IndexConfig } from "@/interfaces/search";
import {
  addDocumentUseCase,
  deleteDocumentUseCase,
  getDocumentUseCase,
  indexDocumentsUseCase,
  updateDocumentUseCase,
} from "../di";
import { BadRequestError, NotFoundError } from "../errors/api-error";
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

export async function handleAddDocument(
  request: Request,
  indexName: string
): Promise<Response> {
  if (request.method !== "POST")
    throw new BadRequestError("Method Not Allowed.");
  try {
    const document: Document = await request.json();
    if (!document || typeof document !== "object") {
      throw new BadRequestError(
        "Invalid JSON payload: Request body must be a JSON object representing the document."
      );
    }
    const addedDocument = await addDocumentUseCase.execute(indexName, document);
    // Return 201 Created with the processed document
    return createJsonResponse(addedDocument, 201);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new BadRequestError("Invalid JSON payload.");
    throw error; // Re-throw other errors (validation, etc.)
  }
}

/** GET /indexes/{indexName}/documents/{documentId} */
export async function handleGetDocument(
  request: Request,
  indexName: string,
  documentId: string
): Promise<Response> {
  if (request.method !== "GET")
    throw new BadRequestError("Method Not Allowed.");
  if (!documentId)
    throw new BadRequestError("Document ID is required in the path.");

  const document = await getDocumentUseCase.execute(indexName, documentId);

  if (!document) {
    throw new NotFoundError(
      `Document with ID "${documentId}" not found in index "${indexName}".`
    );
  }
  return createJsonResponse(document);
}

/** PUT /indexes/{indexName}/documents/{documentId} */
export async function handleUpdateDocument(
  request: Request,
  indexName: string,
  documentId: string
): Promise<Response> {
  if (request.method !== "PUT")
    throw new BadRequestError("Method Not Allowed.");
  if (!documentId)
    throw new BadRequestError("Document ID is required in the path.");

  try {
    const documentData: Document = await request.json();
    if (!documentData || typeof documentData !== "object") {
      throw new BadRequestError(
        "Invalid JSON payload: Request body must be a JSON object representing the document."
      );
    }
    const updatedDocument = await updateDocumentUseCase.execute(
      indexName,
      documentId,
      documentData
    );
    return createJsonResponse(updatedDocument); // Return 200 OK with updated document
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new BadRequestError("Invalid JSON payload.");
    // Handle specific errors like ID mismatch from use case if needed
    if (
      error instanceof Error &&
      error.message.includes("does not match ID in body")
    ) {
      throw new BadRequestError(error.message);
    }
    if (
      error instanceof Error &&
      error.message.includes("configuration not found")
    ) {
      throw new NotFoundError(error.message); // Or BadRequestError? NotFound seems appropriate
    }
    throw error;
  }
}

/** DELETE /indexes/{indexName}/documents/{documentId} */
export async function handleDeleteDocument(
  request: Request,
  indexName: string,
  documentId: string
): Promise<Response> {
  if (request.method !== "DELETE")
    throw new BadRequestError("Method Not Allowed.");
  if (!documentId)
    throw new BadRequestError("Document ID is required in the path.");

  const deleted = await deleteDocumentUseCase.execute(indexName, documentId);

  if (!deleted) {
    throw new NotFoundError(
      `Document with ID "${documentId}" not found in index "${indexName}" for deletion.`
    );
  }
  // Return 204 No Content on successful deletion
  return new Response(null, { status: 204 });
}
