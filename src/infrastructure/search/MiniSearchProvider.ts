import type { Document } from "@/core/domain/Document";
import type { SearchProvider } from "@/core/ports/SearchProvider";
import type {
  IndexConfig,
  SearchParams,
  SearchResponse,
  SuggestParams,
  SuggestResponse,
} from "@/interfaces/Search";
import MiniSearch, {
  type Options as MiniSearchOptions,
  type SearchResult,
} from "minisearch";

export class MiniSearchProvider implements SearchProvider {
  private searchInstances: Map<string, MiniSearch<Document>> = new Map();
  private indexConfigs: Map<string, IndexConfig> = new Map();

  private createMiniSearchInstance(config: IndexConfig): MiniSearch<Document> {
    const options: MiniSearchOptions<Document> = {
      fields: config.fields, // Fields to index for full-text search
      storeFields: config.storeFields, // Fields to return in search results
      idField: config.idField ?? "id", // Unique identifier field
      // Add other MiniSearch options here for performance tuning if needed
      // e.g., processTerm, tokenize, searchOptions
    };
    return new MiniSearch<Document>(options);
  }

  async indexDocuments(
    indexName: string,
    documents: Document[],
    config: IndexConfig
  ): Promise<void> {
    let instance = this.searchInstances.get(indexName);
    if (
      !instance ||
      JSON.stringify(this.indexConfigs.get(indexName)) !==
        JSON.stringify(config)
    ) {
      // Recreate instance if config changes or doesn't exist
      console.log(
        `Initializing or re-initializing MiniSearch index: ${indexName}`
      );
      instance = this.createMiniSearchInstance(config);
      this.searchInstances.set(indexName, instance);
      this.indexConfigs.set(indexName, config);
      // IMPORTANT: MiniSearch requires all documents during initialization or re-indexing.
      // If adding incrementally, use instance.add(doc) BUT be mindful that
      // removing/updating requires re-indexing or managing IDs carefully.
      // For simplicity here, we assume full re-indexing on this call.
      await instance.addAllAsync(documents);
    } else {
      // Efficiently add/update documents if instance exists and config is the same
      // This requires careful handling of updates/deletions.
      // For this example, we'll stick to the simple re-index approach.
      // You could implement `instance.remove(doc)` and `instance.add(doc)`
      // but it's often easier to re-index entirely with MiniSearch unless dataset is huge.
      console.log(`Re-indexing all documents for: ${indexName}`);
      // await instance.removeAllAsync(); // TODO: Not available in MiniSearch
      await instance.addAllAsync(documents);
    }
    console.log(
      `Indexed ${documents.length} documents into index: ${indexName}`
    );
  }

  async search<TDoc extends Document = Document>(
    indexName: string,
    params: SearchParams,
    config: IndexConfig
  ): Promise<SearchResponse<TDoc>> {
    const startTime = performance.now();
    const instance = this.searchInstances.get(indexName);

    if (!instance) {
      throw new Error(`Index "${indexName}" not found.`);
    }

    const { query, offset = 0, limit = 10, filter } = params;

    // Basic filtering - MiniSearch filter needs a function
    const filterFn = filter
      ? (result: SearchResult) => {
          return Object.entries(filter).every(([key, value]) => {
            // Check if the field exists in the stored fields for the result
            // MiniSearch stores results based on `storeFields`
            return config.storeFields.includes(key) && result[key] === value;
          });
        }
      : undefined;

    // Basic sorting - MiniSearch primarily sorts by relevance score.
    // Implementing custom sort post-search can be inefficient for large datasets.
    // We'll rely on relevance for now. Complex sorting might need adjustments.
    // const sortByFn = params.sortBy ? this.createSortFunction(params.sortBy) : undefined;

    const searchResults = instance.search(query, {
      prefix: true, // Enable prefix search (partial word matching)
      fuzzy: 0.2, // Enable fuzzy search (allow some typos)
      filter: filterFn,
      // Note: MiniSearch doesn't directly support offset/limit in search options.
      // We apply pagination *after* getting all results. This is inefficient
      // for very large result sets but simple for MiniSearch.
    });

    const nbHits = searchResults.length;
    const totalPages = Math.ceil(nbHits / limit);
    const page = Math.floor(offset / limit) + 1;

    // Apply pagination
    const paginatedHits = searchResults.slice(offset, offset + limit);

    // Retrieve full documents if necessary (MiniSearch might only store specific fields)
    // In this setup, storeFields determines what's in `hit`. Adjust if needed.
    const hits = paginatedHits.map((hit) => ({
      ...hit, // Includes score, terms, etc. from MiniSearch
      // Ensure all storeFields are present, even if null/undefined
      ...config.storeFields.reduce((acc, field) => {
        acc[field] = hit[field] ?? null;
        return acc;
      }, {} as Record<string, any>),
    })) as unknown as TDoc[];

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);

    return {
      hits: hits,
      nbHits: nbHits,
      query: query,
      limit: limit,
      offset: offset,
      processingTimeMs: processingTimeMs,
      totalPages: totalPages,
      page: page,
      // facetDistribution: {}, // Implement faceting if needed
      exhaustiveNbHits: true, // MiniSearch results are exhaustive
    };
  }

  async suggest(
    indexName: string,
    params: SuggestParams,
    config: IndexConfig
  ): Promise<SuggestResponse> {
    const startTime = performance.now();
    const instance = this.searchInstances.get(indexName);

    if (!instance) {
      throw new Error(`Index "${indexName}" not found.`);
    }

    const { query, limit = 5, filter } = params;

    // Basic filtering support for suggestions
    const filterFn = filter
      ? (result: Document) => {
          // Note: filter for autoSuggest works on the *document*
          return Object.entries(filter).every(([key, value]) => {
            return result[key] === value;
          });
        }
      : undefined;

    const suggestions = instance.autoSuggest(query, {
      // limit: limit, // TODO: Not available in MiniSearch
      filter: filterFn,
      // boost: { title: 2 } // Example: Boost suggestions matching title
    });

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);

    return {
      // Extract the suggestion text
      suggestions: suggestions.map((s) => s.suggestion),
      query: query,
      processingTimeMs: processingTimeMs,
    };
  }

  async hasIndex(indexName: string): Promise<boolean> {
    return this.searchInstances.has(indexName);
  }

  async deleteIndex(indexName: string): Promise<void> {
    this.searchInstances.delete(indexName);
    this.indexConfigs.delete(indexName);
    // Note: This only deletes from the search provider's memory.
    // You'd also need to delete from the persistent repository if applicable.
  }

  // Helper for potential future sorting implementation
  /*
    private createSortFunction(sortBy: string[]): (a: SearchResult, b: SearchResult) => number {
        return (a, b) => {
            for (const sortField of sortBy) {
                const [field, direction = 'asc'] = sortField.split(':');
                const valA = a[field];
                const valB = b[field];

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
            }
            return 0; // Maintain original order if all sort fields are equal
        };
    }
    */
}
