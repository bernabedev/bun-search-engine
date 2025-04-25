import type { SynonymGroup } from "@/core/domain/synonym";
import type { SynonymRepository } from "@/core/ports/synonym-repository";

export class AddSynonymGroupUseCase {
  constructor(private readonly synonymRepository: SynonymRepository) {}

  async execute(group: SynonymGroup): Promise<void> {
    // Add validation if needed (e.g., check for empty strings)
    if (!Array.isArray(group) || group.length < 2) {
      throw new Error(
        "Synonym group must be an array of at least two strings."
      );
    }
    await this.synonymRepository.saveGroup(group);
  }
}
