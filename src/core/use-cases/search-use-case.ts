import type { Document } from "@/core/domain/document";
import type { IndexRepository } from "@/core/ports/index-repository";
import type { SearchProvider } from "@/core/ports/search-provider";
import type { SearchParams, SearchResponse } from "@/interfaces/search";
import type { SynonymRepository } from "../ports/synonym-repository";

export class SearchUseCase {
  constructor(
    private readonly searchProvider: SearchProvider,
    private readonly indexRepository: IndexRepository,
    private readonly synonymRepository: SynonymRepository
  ) {}

  private normalizeWord(word: string): string {
    // Consistent normalization
    return word.trim().toLowerCase();
  }
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

    // --- Synonym Query Expansion ---
    let finalQuery = params.query ?? "";
    if (finalQuery.trim() !== "") {
      // Only expand non-empty queries
      const queryTerms = finalQuery.split(/\s+/); // Simple space split
      const expandedTerms = new Set<string>(); // Use Set to avoid duplicate terms

      for (const term of queryTerms) {
        const normalizedTerm = this.normalizeWord(term);
        if (!normalizedTerm) continue;

        const synonyms = await this.synonymRepository.findSynonyms(
          normalizedTerm
        );
        if (synonyms) {
          // Add all synonyms (including original term) to the expanded set
          synonyms.forEach((syn) => expandedTerms.add(syn));
        } else {
          // If no synonyms, add the original normalized term
          expandedTerms.add(normalizedTerm);
        }
      }

      // Reconstruct the query string with expanded terms
      if (expandedTerms.size > 0) {
        finalQuery = Array.from(expandedTerms).join(" ");
        console.debug(`Expanded query: "${params.query}" -> "${finalQuery}"`);
      }
    }

    const finalParams: SearchParams = {
      ...params,
      query: finalQuery,
    };

    // Execute search
    return await this.searchProvider.search<TDoc>(
      indexName,
      finalParams,
      config
    );
  }
}
