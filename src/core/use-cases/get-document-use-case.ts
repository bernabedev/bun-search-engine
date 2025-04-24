import type { Document } from "@/core/domain/document";
import type { IndexRepository } from "@/core/ports/index-repository";

export class GetDocumentUseCase {
  constructor(private readonly indexRepository: IndexRepository) {}

  async execute(
    indexName: string,
    documentId: string
  ): Promise<Document | null> {
    // Document ID is expected to be string here
    return await this.indexRepository.getDocument(indexName, documentId);
  }
}
