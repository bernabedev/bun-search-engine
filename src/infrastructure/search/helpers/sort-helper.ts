import type { SearchResult } from "minisearch";

type SortDirection = "asc" | "desc";
type SortCriterion = { field: string; direction: SortDirection };
type SortCompareFn = (a: SearchResult, b: SearchResult) => number;

export function sortFunction(
  sortBy: string[],
  storeFields: string[]
): SortCompareFn | null {
  if (!sortBy || sortBy.length === 0) {
    return null; // No custom sorting needed
  }

  const criteria: SortCriterion[] = sortBy
    .map((sortString) => {
      const [field, direction = "asc"] = sortString.split(":");
      if (!storeFields.includes(field)) {
        console.warn(
          `Sorting skipped for field "${field}": Not included in index's storeFields.`
        );
        // Return a dummy criterion or filter it out - let's filter it out
        return null;
      }
      return {
        field,
        direction: direction.toLowerCase() === "desc" ? "desc" : "asc",
      };
    })
    .filter((criterion): criterion is SortCriterion => criterion !== null); // Remove invalid fields

  if (criteria.length === 0) {
    console.warn(
      `No valid fields found for sorting after checking storeFields.`
    );
    return null; // No valid fields left to sort by
  }

  // Return the comparison function
  return (a: SearchResult, b: SearchResult): number => {
    for (const { field, direction } of criteria) {
      const valA = a[field];
      const valB = b[field];

      // Define null/undefined order (e.g., nulls last for asc, first for desc)
      const nullOrder = direction === "asc" ? 1 : -1;
      if (valA === null || valA === undefined) {
        return valB === null || valB === undefined ? 0 : nullOrder;
      }
      if (valB === null || valB === undefined) {
        return -nullOrder;
      }

      let comparison = 0;
      // Basic type comparison
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        // Default to string comparison using localeCompare for better string sorting
        comparison = String(valA).localeCompare(String(valB));
      }

      // If values are different, return comparison result adjusted for direction
      if (comparison !== 0) {
        return direction === "asc" ? comparison : -comparison;
      }
      // If values are equal, continue to the next criterion
    }
    // If all criteria are equal, maintain original relative order (which was relevance score)
    return 0;
  };
}
