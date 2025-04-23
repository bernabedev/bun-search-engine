import type { Document } from "@/core/domain/Document";
import type {
  IndexConfig,
  SearchParams,
  SearchResponse,
  SuggestParams,
  SuggestResponse,
} from "@/interfaces/Search";

export interface SearchProvider {
  /**
   * Initializes or updates an index with documents.
   */
  indexDocuments(
    indexName: string,
    documents: Document[],
    config: IndexConfig
  ): Promise<void>;

  /**
   * Performs a search query on a specific index.
   */
  search<TDoc extends Document = Document>(
    indexName: string,
    params: SearchParams,
    config: IndexConfig // Pass config for potential runtime adjustments
  ): Promise<SearchResponse<TDoc>>;

  /**
   * Provides query suggestions or autocomplete terms.
   */
  suggest(
    indexName: string,
    params: SuggestParams,
    config: IndexConfig
  ): Promise<SuggestResponse>;

  /**
   * Checks if an index exists in the provider's internal state.
   */
  hasIndex(indexName: string): Promise<boolean>;

  /**
   * Deletes an index.
   */
  deleteIndex(indexName: string): Promise<void>;
}
