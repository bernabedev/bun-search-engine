import type { Document } from "@/core/domain/document";
import type { SearchProvider } from "@/core/ports/search-provider";
import type {
  IndexConfig,
  NumericFacetStats,
  SearchParams,
  SearchResponse,
  SuggestParams,
  SuggestResponse,
} from "@/interfaces/search";
import MiniSearch, {
  type Options as MiniSearchOptions,
  type SearchResult,
} from "minisearch";
import { sortFunction } from "./helpers/sort-helper";

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

    const { query, offset = 0, limit = 10, filter, facets, sortBy } = params;

    // Advanced filtering - MiniSearch filter needs a function
    const filterFn = filter
      ? (result: SearchResult): boolean => {
          // result contains stored fields
          // Iterate over all filter conditions provided in filter
          return Object.entries(filter!).every(([field, condition]) => {
            // Check if the field exists in the document's stored fields
            // Note: Filtering only works reliably on fields included in 'storeFields'
            if (!(field in result)) {
              console.warn(
                `Attempting to filter on field "${field}" which is not in storeFields or not present in document ID ${result.id}. Skipping filter for this field.`
              );
              return true; // Or return false if missing fields should exclude the doc? Let's be lenient.
            }

            const documentValue = result[field];

            if (
              typeof condition === "object" &&
              condition !== null &&
              !Array.isArray(condition)
            ) {
              // --- Handle Range Object (e.g., { gt: 5.99, lte: 20 }) ---
              return Object.entries(condition).every(
                ([operator, filterValue]) => {
                  // Ensure the document value is comparable (e.g., number for gt/lt)
                  // Add type checks as needed based on your data
                  const docNum =
                    typeof documentValue === "number"
                      ? documentValue
                      : parseFloat(documentValue);
                  const filterNum =
                    typeof filterValue === "number"
                      ? filterValue
                      : parseFloat(filterValue as string);

                  // Basic type check for numeric comparison
                  if (typeof docNum !== "number" || isNaN(docNum)) {
                    console.warn(
                      `Document field "${field}" (value: ${documentValue}) is not a number, cannot apply range operator "${operator}".`
                    );
                    return false; // Cannot compare non-numbers with range operators
                  }
                  if (typeof filterNum !== "number" || isNaN(filterNum)) {
                    console.warn(
                      `Filter value "${filterValue}" for operator "${operator}" on field "${field}" is not a valid number.`
                    );
                    return false; // Invalid filter value
                  }

                  switch (operator) {
                    case "gt":
                      return docNum > filterNum;
                    case "gte":
                      return docNum >= filterNum;
                    case "lt":
                      return docNum < filterNum;
                    case "lte":
                      return docNum <= filterNum;
                    default:
                      console.warn(`Unsupported filter operator: ${operator}`);
                      return false; // Unknown operator fails the filter
                  }
                }
              );
            } else {
              // --- Handle Exact Match ---
              // Consider case sensitivity, array contains, etc. if needed
              return documentValue === condition;
            }
          });
        }
      : undefined; // No filter if filter is not provided

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

    let facetDistribution: Record<string, Record<string, number>> | undefined =
      undefined;
    let facetStats: Record<string, NumericFacetStats> | undefined = undefined;
    if (facets && facets.length > 0 && searchResults.length > 0) {
      facetDistribution = {};
      facetStats = {};
      const numericTrackers: Record<
        string,
        {
          min: number;
          max: number;
          sum: number;
          count: number;
          isNumeric: boolean;
          initialized: boolean;
        }
      > = {};

      for (const facetField of facets) {
        // Facet calculation requires the field to be in storeFields
        if (!config.storeFields.includes(facetField)) {
          console.warn(
            `Faceting skipped for field "${facetField}": Not included in index's storeFields.`
          );
          continue;
        }

        // Initialize structures for this facet field
        facetDistribution[facetField] = {}; // For categorical counts
        // Prepare tracker for potential numeric stats
        numericTrackers[facetField] = {
          min: Infinity,
          max: -Infinity,
          sum: 0,
          count: 0,
          isNumeric: true,
          initialized: false,
        };

        for (const hit of searchResults) {
          const documentValue = hit[facetField];

          // Skip null or undefined values for faceting
          if (documentValue === undefined || documentValue === null) {
            continue;
          }

          const currentTracker = numericTrackers[facetField];

          // Attempt numeric stats calculation
          if (currentTracker.isNumeric) {
            if (typeof documentValue === "number" && !isNaN(documentValue)) {
              currentTracker.initialized = true; // Mark as having seen at least one number
              currentTracker.min = Math.min(currentTracker.min, documentValue);
              currentTracker.max = Math.max(currentTracker.max, documentValue);
              currentTracker.sum += documentValue;
              currentTracker.count++;
            } else {
              // If we encounter a non-numeric value, this field is not purely numeric
              // Stop calculating stats for it and rely only on categorical counts
              currentTracker.isNumeric = false;
            }
          }

          // --- Categorical Facet Count ---
          // Always calculate categorical counts, even for numeric fields (e.g., count of products at $5.99)
          // Handle potential arrays in the future if needed
          const stringValue = String(documentValue);
          facetDistribution[facetField][stringValue] =
            (facetDistribution[facetField][stringValue] || 0) + 1;
        } // End loop through hits for this facetField

        // --- Finalize Numeric Stats ---
        const finalTracker = numericTrackers[facetField];
        if (
          finalTracker.isNumeric &&
          finalTracker.initialized &&
          finalTracker.count > 0
        ) {
          // Calculate avg, handle division by zero just in case (though count > 0 check helps)
          const avg =
            finalTracker.count > 0 ? finalTracker.sum / finalTracker.count : 0;
          facetStats[facetField] = {
            min: finalTracker.min,
            max: finalTracker.max,
            avg: avg,
            sum: finalTracker.sum,
            count: finalTracker.count,
          };
        }

        // Clean up empty categorical distribution if no values were found
        if (Object.keys(facetDistribution[facetField]).length === 0) {
          delete facetDistribution[facetField];
        }
      } // End loop through requested facetFields

      // Clean up overall facet/stats objects if they ended up empty
      if (Object.keys(facetStats).length === 0) facetStats = undefined;
      if (Object.keys(facetDistribution).length === 0)
        facetDistribution = undefined;
    }

    const sortCompareFn = sortFunction(sortBy || [], config.storeFields);
    if (sortCompareFn) {
      console.debug(`Applying custom sort based on: ${sortBy?.join(", ")}`);
      searchResults.sort(sortCompareFn); // Sort the full results array in place
    } else {
      console.debug(`No custom sort applied, using default relevance order.`);
    }

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
      facetDistribution: facetDistribution,
      facetStats: facetStats,
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
}
