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
  facetDistribution?: Record<string, Record<string, number>>; // For future faceting
  exhaustiveNbHits: boolean; // Indicates if nbHits is approximate
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
}

// Parameters for Suggest/Autocomplete requests
export interface SuggestParams {
  query: string;
  limit?: number;
  filter?: Record<string, any>; // Allow filtering suggestions
}
