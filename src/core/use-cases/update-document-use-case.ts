import type { Document } from "@/core/domain/document";
import type { IndexRepository } from "@/core/ports/index-repository";
import type { SearchProvider } from "@/core/ports/search-provider";
import { preprocessDocument } from "./preprocess-use-case";

export class UpdateDocumentUseCase {
  constructor(
    private readonly indexRepository: IndexRepository,
    private readonly searchProvider: SearchProvider
  ) {}

  async execute(
    indexName: string,
    documentIdFromPath: string,
    documentData: Document
  ): Promise<Document> {
    const config = await this.indexRepository.getIndexConfig(indexName);
    if (!config) {
      throw new Error(`Index "${indexName}" configuration not found.`);
    }

    // Preprocess the incoming document data
    const processedDocument = preprocessDocument(documentData, config);
    const idField = config.idField ?? "id";
    const documentIdFromBody = processedDocument[idField];

    // Validate ID consistency
    if (documentIdFromBody === undefined || documentIdFromBody === null) {
      throw new Error(
        `Updated document data must contain the ID field '${idField}'.`
      );
    }
    if (String(documentIdFromBody) !== documentIdFromPath) {
      throw new Error(
        `Document ID in path (${documentIdFromPath}) does not match ID in body (${documentIdFromBody}).`
      );
    }

    // Check if document actually exists first (optional, PUT implies create or replace)
    // const existing = await this.indexRepository.getDocument(indexName, documentIdFromPath);
    // if (!existing) {
    //    throw new Error(`Document with ID "${documentIdFromPath}" not found for update.`);
    // }

    // Save/overwrite in persistent store
    await this.indexRepository.saveDocument(indexName, processedDocument);

    // Add/update in search index
    await this.searchProvider.upsertDocument(
      indexName,
      processedDocument,
      config
    );

    return processedDocument;
  }
}
