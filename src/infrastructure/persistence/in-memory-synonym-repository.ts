import type { SynonymGroup } from "@/core/domain/synonym";
import type { SynonymRepository } from "@/core/ports/synonym-repository";

export class InMemorySynonymRepository implements SynonymRepository {
  // Store canonical word -> set of synonyms (including canonical)
  private synonymMap: Map<string, Set<string>> = new Map();
  // Store word -> canonical word mapping for quick lookup
  private wordToCanonicalMap: Map<string, string> = new Map();

  private normalizeWord(word: string): string {
    // Basic normalization: lowercase and trim
    return word.trim().toLowerCase();
  }

  async saveGroup(group: SynonymGroup): Promise<void> {
    if (!group || group.length < 2) {
      console.warn("Synonym group must contain at least two words.", group);
      return; // Or throw error?
    }

    const normalizedGroup = group.map(this.normalizeWord).filter(Boolean);
    if (normalizedGroup.length < 2) return; // Ignore empty/single-word groups after normalization

    let targetGroup: Set<string> = new Set();
    let canonicalWord: string | null = null;

    // Check if any word in the new group already exists and merge
    for (const word of normalizedGroup) {
      const existingCanonical = this.wordToCanonicalMap.get(word);
      if (existingCanonical) {
        const existingGroup = this.synonymMap.get(existingCanonical);
        if (existingGroup) {
          if (!canonicalWord) {
            // First existing group found, adopt its canonical word and members
            canonicalWord = existingCanonical;
            targetGroup = new Set(existingGroup); // Copy existing group
          } else if (canonicalWord !== existingCanonical) {
            // Merge this group into the targetGroup
            existingGroup.forEach((w) => targetGroup.add(w));
            // Update mappings for the merged group's words
            existingGroup.forEach((w) =>
              this.wordToCanonicalMap.set(w, canonicalWord ?? "")
            );
            // Remove the old canonical entry
            this.synonymMap.delete(existingCanonical);
          }
          // else: word belongs to the same group we already adopted, do nothing extra
        }
      }
    }

    // If no existing group was found, pick the first word as canonical
    if (!canonicalWord) {
      canonicalWord = normalizedGroup[0];
    }

    // Add all words from the input group to the target group
    normalizedGroup.forEach((word) => targetGroup.add(word));

    // Save the final merged group
    this.synonymMap.set(canonicalWord, targetGroup);

    // Update the word-to-canonical mapping for all words in the final group
    targetGroup.forEach((word) =>
      this.wordToCanonicalMap.set(word, canonicalWord!)
    );

    console.log(
      `Saved synonym group (Canonical: ${canonicalWord}):`,
      Array.from(targetGroup)
    );
  }

  async getAllGroups(): Promise<SynonymGroup[]> {
    // Return the values (the sets) from the synonymMap as arrays
    return Array.from(this.synonymMap.values()).map((set) => Array.from(set));
  }

  async findSynonyms(word: string): Promise<Set<string> | null> {
    const normalized = this.normalizeWord(word);
    const canonical = this.wordToCanonicalMap.get(normalized);
    if (!canonical) {
      return null; // Word not part of any known synonym group
    }
    return this.synonymMap.get(canonical) || null; // Return the full set
  }

  async deleteWord(word: string): Promise<boolean> {
    const normalized = this.normalizeWord(word);
    const canonical = this.wordToCanonicalMap.get(normalized);

    if (!canonical) {
      return false; // Word not found
    }

    const group = this.synonymMap.get(canonical);
    if (!group) {
      // Should not happen if wordToCanonicalMap is consistent, but handle defensively
      this.wordToCanonicalMap.delete(normalized);
      return false;
    }

    // Remove the word from the group set
    group.delete(normalized);
    // Remove the word's mapping
    this.wordToCanonicalMap.delete(normalized);

    console.log(
      `Removed synonym "${normalized}" from group (Canonical: ${canonical})`
    );

    // Optional: If the group becomes too small (e.g., < 2 words), delete the group entirely
    if (group.size < 2) {
      console.log(
        `Synonym group for canonical "${canonical}" is now too small, deleting group.`
      );
      this.synonymMap.delete(canonical);
      // Remove mappings for remaining words in the small group
      group.forEach((remainingWord) =>
        this.wordToCanonicalMap.delete(remainingWord)
      );
    } else if (normalized === canonical) {
      // If we deleted the canonical word, assign a new canonical word
      const newCanonical = Array.from(group)[0]; // Pick the first remaining word
      this.synonymMap.delete(canonical); // Remove old entry
      this.synonymMap.set(newCanonical, group); // Add new entry
      // Update mappings for all words in the group
      group.forEach((w) => this.wordToCanonicalMap.set(w, newCanonical));
      console.log(
        `Promoted "${newCanonical}" to canonical word for the group.`
      );
    }

    return true;
  }
}
