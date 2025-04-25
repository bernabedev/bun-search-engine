import type { SynonymRepository } from "@/core/ports/synonym-repository";

export class DeleteSynonymUseCase {
  constructor(private readonly synonymRepository: SynonymRepository) {}

  async execute(word: string): Promise<boolean> {
    if (!word || typeof word !== "string" || word.trim() === "") {
      throw new Error("Word to delete cannot be empty.");
    }
    return await this.synonymRepository.deleteWord(word);
  }
}
