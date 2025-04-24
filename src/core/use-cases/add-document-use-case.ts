import type { Document } from "@/core/domain/document";
import type { IndexRepository } from "@/core/ports/index-repository";
import type { SearchProvider } from "@/core/ports/search-provider";
import { preprocessDocument } from "./preprocess-use-case";

export class AddDocumentUseCase {
  constructor(
    private readonly indexRepository: IndexRepository,
    private readonly searchProvider: SearchProvider
  ) {}

  async execute(indexName: string, document: Document): Promise<Document> {
    const config = await this.indexRepository.getIndexConfig(indexName);
    if (!config) {
      throw new Error(`Index "${indexName}" configuration not found.`);
    }

    // Preprocess the document (add string ID, category_names etc.)
    const processedDocument = preprocessDocument(document, config);
    const idField = config.idField ?? "id";
    const documentId = processedDocument[idField];

    if (documentId === undefined || documentId === null) {
      throw new Error(
        `Document ID could not be determined using field '${idField}'.`
      );
    }

    // Check if document with this ID already exists in repository? Optional based on desired behavior.
    // const existing = await this.indexRepository.getDocument(indexName, String(documentId));
    // if (existing) {
    //    throw new Error(`Document with ID "${documentId}" already exists. Use update operation instead.`);
    // }

    // Save to persistent store
    await this.indexRepository.saveDocument(indexName, processedDocument);

    // Add to search index (use upsert for simplicity)
    await this.searchProvider.upsertDocument(
      indexName,
      processedDocument,
      config
    );

    return processedDocument; // Return the processed document
  }
}
