// Defines the configuration for an index
export interface IndexConfig {
  fields: string[]; // Fields to index for full-text search
  storeFields: string[]; // Fields to store and return in search results
  idField?: string; // Field to use as the unique document ID (defaults to 'id')
}

// Standard Search API Response Structure
export interface SearchResponse<TDoc = Document> {
  hits: TDoc[];
  nbHits: number;
  query: string;
  limit: number;
  offset: number;
  processingTimeMs: number;
  totalPages: number;
  page: number;
  facetDistribution?: Record<string, Record<string, number>>;
  facetStats?: Record<string, NumericFacetStats>;
  exhaustiveNbHits: boolean;
}

// Standard Suggest API Response Structure
export interface SuggestResponse {
  suggestions: string[];
  query: string;
  processingTimeMs: number;
}

// Parameters for Search requests
export interface SearchParams {
  query: string;
  offset?: number;
  limit?: number;
  filter?: Record<string, any>; // Simple key-value filter for now
  sortBy?: string[]; // e.g., ['year:desc', 'rating:asc'] - Basic support
  facets?: string[]; // Array of field names to compute facets for
}

// Parameters for Suggest/Autocomplete requests
export interface SuggestParams {
  query: string;
  limit?: number;
  filter?: Record<string, any>; // Allow filtering suggestions
}

// Interface for basic numeric stats
export interface NumericFacetStats {
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number; // Number of documents with numeric values for this facet
}
