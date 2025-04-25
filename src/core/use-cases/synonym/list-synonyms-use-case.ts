import type { SynonymGroup } from "@/core/domain/synonym";
import type { SynonymRepository } from "@/core/ports/synonym-repository";

export class ListSynonymsUseCase {
  constructor(private readonly synonymRepository: SynonymRepository) {}

  async execute(): Promise<SynonymGroup[]> {
    return await this.synonymRepository.getAllGroups();
  }
}
