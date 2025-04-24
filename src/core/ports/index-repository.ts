import type { Document } from "@/core/domain/document";
import type { IndexConfig } from "@/interfaces/search";

export interface IndexRepository {
  addDocuments(indexName: string, documents: Document[]): Promise<void>;
  getDocuments(indexName: string, ids: string[]): Promise<Document[]>;
  getAllDocuments(indexName: string): Promise<Document[]>; // Needed for MiniSearch re-indexing or initial load
  getIndexConfig(indexName: string): Promise<IndexConfig | null>;
  saveIndexConfig(indexName: string, config: IndexConfig): Promise<void>;
  listIndexes(): Promise<string[]>;
}
