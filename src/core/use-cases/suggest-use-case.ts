import type { IndexRepository } from "@/core/ports/index-repository";
import type { SearchProvider } from "@/core/ports/search-provider";
import type { SuggestParams, SuggestResponse } from "@/interfaces/search";

export class SuggestUseCase {
  constructor(
    private readonly searchProvider: SearchProvider,
    private readonly indexRepository: IndexRepository // Needed to get config
  ) {}

  async execute(
    indexName: string,
    params: SuggestParams
  ): Promise<SuggestResponse> {
    if (!indexName) {
      throw new Error("Index name is required.");
    }
    if (!params.query) {
      // Return empty suggestions if query is empty
      return { suggestions: [], query: "", processingTimeMs: 0 };
    }

    const config = await this.indexRepository.getIndexConfig(indexName);
    if (!config) {
      throw new Error(`Configuration for index "${indexName}" not found.`);
    }

    // Ensure index exists in provider (similar logic to SearchUseCase)
    if (!(await this.searchProvider.hasIndex(indexName))) {
      console.warn(
        `Index "${indexName}" not found in provider for suggest, attempting reload.`
      );
      const allDocs = await this.indexRepository.getAllDocuments(indexName);
      if (allDocs.length > 0) {
        await this.searchProvider.indexDocuments(indexName, allDocs, config);
        console.log(
          `Index "${indexName}" reloaded into search provider for suggest.`
        );
      } else {
        console.warn(
          `No documents found for index "${indexName}" during reload for suggest.`
        );
        return { suggestions: [], query: params.query, processingTimeMs: 0 };
      }
    }

    return await this.searchProvider.suggest(indexName, params, config);
  }
}
