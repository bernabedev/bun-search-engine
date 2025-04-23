import type { Document } from "@/core/domain/Document";
import type { IndexRepository } from "@/core/ports/IndexRepository";
import type { SearchProvider } from "@/core/ports/SearchProvider";
import type { SearchParams, SearchResponse } from "@/interfaces/Search";

export class SearchUseCase {
  constructor(
    private readonly searchProvider: SearchProvider,
    private readonly indexRepository: IndexRepository // Needed to get config
  ) {}

  async execute<TDoc extends Document = Document>(
    indexName: string,
    params: SearchParams
  ): Promise<SearchResponse<TDoc>> {
    if (!indexName) {
      throw new Error("Index name is required.");
    }
    if (!params.query === undefined) {
      // Allow empty query for browsing? Maybe later.
      throw new Error("Search query is required.");
    }

    const config = await this.indexRepository.getIndexConfig(indexName);
    if (!config) {
      throw new Error(`Configuration for index "${indexName}" not found.`);
    }

    // Ensure the index is actually loaded in the search provider
    // This handles cases where the server restarts and loses in-memory state
    if (!(await this.searchProvider.hasIndex(indexName))) {
      console.warn(
        `Index "${indexName}" not found in provider, attempting to reload from repository.`
      );
      const allDocs = await this.indexRepository.getAllDocuments(indexName);
      if (allDocs.length > 0) {
        await this.searchProvider.indexDocuments(indexName, allDocs, config);
        console.log(`Index "${indexName}" reloaded into search provider.`);
      } else {
        // If no docs found after restart and config exists, still throw?
        // Or return empty results? Let's return empty for now.
        console.warn(
          `No documents found in repository for index "${indexName}" during reload.`
        );
        const startTime = performance.now();
        const endTime = performance.now();
        return {
          hits: [],
          nbHits: 0,
          query: params.query,
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
          processingTimeMs: Math.round(endTime - startTime),
          totalPages: 0,
          page: 1,
          exhaustiveNbHits: true,
        };
      }
    }

    // Execute search
    return await this.searchProvider.search<TDoc>(indexName, params, config);
  }
}
