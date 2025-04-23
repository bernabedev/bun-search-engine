import type { Document } from "@/core/domain/Document";
import type { IndexRepository } from "@/core/ports/IndexRepository";
import type { IndexConfig } from "@/interfaces/Search";

// Very basic in-memory storage. In a real app, use a database or file system.
export class InMemoryIndexRepository implements IndexRepository {
  private dataStore: Map<string, Map<string, Document>> = new Map();
  private configStore: Map<string, IndexConfig> = new Map();
  private readonly idField: string = "id"; // Default, could be configurable

  async addDocuments(indexName: string, documents: Document[]): Promise<void> {
    if (!this.dataStore.has(indexName)) {
      this.dataStore.set(indexName, new Map());
    }
    const indexData = this.dataStore.get(indexName)!;
    for (const doc of documents) {
      if (!doc[this.idField]) {
        console.warn(
          `Document is missing the ID field '${this.idField}':`,
          doc
        );
        continue; // Skip documents without an ID
      }
      indexData.set(doc[this.idField], doc);
    }
  }

  async getDocuments(indexName: string, ids: string[]): Promise<Document[]> {
    const indexData = this.dataStore.get(indexName);
    if (!indexData) {
      return [];
    }
    return ids
      .map((id) => indexData.get(id))
      .filter((doc): doc is Document => !!doc);
  }

  async getAllDocuments(indexName: string): Promise<Document[]> {
    const indexData = this.dataStore.get(indexName);
    if (!indexData) {
      return [];
    }
    return Array.from(indexData.values());
  }

  async getIndexConfig(indexName: string): Promise<IndexConfig | null> {
    return this.configStore.get(indexName) || null;
  }

  async saveIndexConfig(indexName: string, config: IndexConfig): Promise<void> {
    this.configStore.set(indexName, {
      ...config,
      idField: config.idField ?? this.idField,
    });
  }

  async listIndexes(): Promise<string[]> {
    return Array.from(this.dataStore.keys());
  }
}
