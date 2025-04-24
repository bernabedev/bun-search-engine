import type { IndexConfig } from "@/interfaces/search";
import type { Document } from "../domain/document";

/**
 * Preprocesses a single document for indexing based on config.
 * Adds string ID, category_names, sku_str etc.
 */
export function preprocessDocument(
  document: Document,
  config: IndexConfig
): Document {
  const idField = config.idField ?? "id";

  // Handle specific preprocessing based on expected product structure
  // Make this more generic or configurable if handling different index types
  let processedDoc: Document = { ...document };

  // 1. Ensure string ID exists if original ID field is different
  if (idField !== "sku" && document.sku !== undefined) {
    // Example check
    processedDoc[idField] = `prod_${document.sku}`;
  } else if (document[idField] === undefined) {
    // Handle missing ID based on config
    console.error(
      `Document missing configured ID field '${idField}':`,
      document
    );
    throw new Error(`Document missing required ID field: ${idField}`);
  } else {
    // Ensure the configured ID field is a string if not already
    processedDoc[idField] = String(document[idField]);
  }

  // 2. Flatten category names if 'category' array exists
  if (Array.isArray(document.category)) {
    processedDoc.category_names = document.category
      .map((cat: any) => cat?.name)
      .filter((name) => typeof name === "string");
  }

  // 3. Add string version of SKU if it exists
  if (document.sku !== undefined) {
    processedDoc.sku_str = String(document.sku);
  }

  // Add other preprocessing steps as needed

  return processedDoc;
}
