import type { Document } from "@/core/domain/document";
import type { IndexConfig } from "@/interfaces/search";

export interface IndexRepository {
  addDocuments(indexName: string, documents: Document[]): Promise<void>;
  getDocuments(indexName: string, ids: string[]): Promise<Document[]>;
  getAllDocuments(indexName: string): Promise<Document[]>; // Needed for MiniSearch re-indexing or initial load
  getIndexConfig(indexName: string): Promise<IndexConfig | null>;
  saveIndexConfig(indexName: string, config: IndexConfig): Promise<void>;
  listIndexes(): Promise<string[]>;
  saveDocument(indexName: string, document: Document): Promise<void>;
  getDocument(indexName: string, documentId: string): Promise<Document | null>;
  deleteDocument(indexName: string, documentId: string): Promise<boolean>;
  deleteIndexData?(indexName: string): Promise<void>;
}
