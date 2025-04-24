import type { Document } from "@/core/domain/document";
import type { IndexRepository } from "@/core/ports/index-repository";
import type { IndexConfig } from "@/interfaces/search";

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

  private getIndexDataStore(indexName: string): Map<string, Document> {
    if (!this.dataStore.has(indexName)) {
      this.dataStore.set(indexName, new Map());
    }
    return this.dataStore.get(indexName)!;
  }

  private getIdField(config: IndexConfig | null): string {
    return config?.idField ?? "id"; // Default to 'id' if config somehow missing
  }

  async saveDocument(indexName: string, document: Document): Promise<void> {
    const config = await this.getIndexConfig(indexName);
    const idField = this.getIdField(config);
    const documentId = document[idField];

    if (documentId === undefined || documentId === null) {
      console.error(
        `Document is missing the ID field '${idField}' for save:`,
        document
      );
      throw new Error(`Document must have the ID field '${idField}' defined.`);
    }
    const indexData = this.getIndexDataStore(indexName);
    indexData.set(String(documentId), document); // Store with string ID
  }

  async getDocument(
    indexName: string,
    documentId: string
  ): Promise<Document | null> {
    const indexData = this.dataStore.get(indexName);
    if (!indexData) {
      return null;
    }
    // Document ID is expected to be string here as we store it that way
    return indexData.get(documentId) || null;
  }

  async deleteDocument(
    indexName: string,
    documentId: string
  ): Promise<boolean> {
    const indexData = this.dataStore.get(indexName);
    if (!indexData) {
      return false; // Index doesn't exist
    }
    // Document ID is expected to be string here
    return indexData.delete(documentId); // Map.delete returns true if exists and deleted, false otherwise
  }

  async deleteIndexData(indexName: string): Promise<void> {
    this.dataStore.delete(indexName);
    this.configStore.delete(indexName); // Also remove config when index is deleted
  }
}
