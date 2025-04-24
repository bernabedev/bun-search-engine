import type { IndexRepository } from "@/core/ports/index-repository";
import type { SearchProvider } from "@/core/ports/search-provider";

export class DeleteDocumentUseCase {
  constructor(
    private readonly indexRepository: IndexRepository,
    private readonly searchProvider: SearchProvider
  ) {}

  async execute(indexName: string, documentId: string): Promise<boolean> {
    const config = await this.indexRepository.getIndexConfig(indexName);
    if (!config) {
      console.warn(
        `Index "${indexName}" configuration not found during delete.`
      );
      // If index doesn't exist, document can't exist.
      // Depending on desired behavior, could throw or return false. Let's return false.
      return false;
    }

    // Delete from search index first (or concurrently)
    const deletedFromSearch = await this.searchProvider.deleteDocument(
      indexName,
      documentId,
      config
    );

    console.log("Deleted from search index:", deletedFromSearch);

    // Delete from persistent store
    const deletedFromRepo = await this.indexRepository.deleteDocument(
      indexName,
      documentId
    );

    // Return true if it was found and deleted in *either* place?
    // Or should it require both? Let's say repo is the source of truth.
    return deletedFromRepo;
  }
}
