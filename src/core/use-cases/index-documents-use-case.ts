import type { Document } from "@/core/domain/document";
import type { IndexRepository } from "@/core/ports/index-repository";
import type { SearchProvider } from "@/core/ports/search-provider";
import type { IndexConfig } from "@/interfaces/search";

export class IndexDocumentsUseCase {
  constructor(
    private readonly indexRepository: IndexRepository,
    private readonly searchProvider: SearchProvider
  ) {}

  async execute(
    indexName: string,
    documents: Document[],
    config: IndexConfig
  ): Promise<{ count: number }> {
    if (!indexName) {
      throw new Error("Index name is required.");
    }
    if (!documents || documents.length === 0) {
      console.warn(`No documents provided for indexing in "${indexName}".`);
      // Decide if we should clear the index or do nothing
      // For now, let's ensure the index exists with the config, even if empty
    }
    if (
      !config ||
      !config.fields ||
      config.fields.length === 0 ||
      !config.storeFields
    ) {
      throw new Error("Index configuration (fields, storeFields) is required.");
    }

    // Persist the configuration
    await this.indexRepository.saveIndexConfig(indexName, config);

    // Persist the documents (optional depending on strategy, but good for recovery)
    // If data is large, only store IDs and fetch details on demand.
    // For InMemory, storing all is fine.
    await this.indexRepository.addDocuments(indexName, documents);

    // Get all documents for this index from the repository for indexing
    // MiniSearch typically needs the full dataset for addAllAsync
    const allDocsForIndex = await this.indexRepository.getAllDocuments(
      indexName
    );

    // Index documents in the search provider
    await this.searchProvider.indexDocuments(
      indexName,
      allDocsForIndex,
      config
    );

    return { count: documents.length };
  }

  async deleteIndex(indexName: string): Promise<void> {
    if (!indexName) {
      throw new Error("Index name is required for deletion.");
    }
    // Delete from search provider
    await this.searchProvider.deleteIndex(indexName);
    // Delete data and config from repository
    if (this.indexRepository.deleteIndexData) {
      await this.indexRepository.deleteIndexData(indexName);
    } else {
      console.warn(
        "IndexRepository does not implement deleteIndexData. Data might remain."
      );
    }
    console.log(`Index "${indexName}" and its data/config deleted.`);
  }
}
