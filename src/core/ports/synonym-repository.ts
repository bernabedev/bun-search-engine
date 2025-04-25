import type { SynonymGroup } from "../domain/synonym";

export interface SynonymRepository {
  /** Adds or updates a synonym group. Merges if words already exist in other groups. */
  saveGroup(group: SynonymGroup): Promise<void>;

  /** Retrieves all defined synonym groups. */
  getAllGroups(): Promise<SynonymGroup[]>;

  /** Finds all synonyms for a given word (including the word itself). */
  findSynonyms(word: string): Promise<Set<string> | null>; // Returns a Set for efficient lookup

  /** Deletes a word and its association from all synonym groups. */
  deleteWord(word: string): Promise<boolean>; // Returns true if the word was found and removed
}
