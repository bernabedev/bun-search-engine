import type { Document } from "@/core/domain/document";
import type { IndexConfig } from "@/interfaces/search";
import { indexDocumentsUseCase } from "./di"; // Import use case

export async function loadInitialData() {
  try {
    console.log("Loading initial data...");

    // --- URL for the products data ---
    const productsUrl =
      "https://ka0qscxi58.ufs.sh/f/XtLLY2rlsfUdYzxV1quOc4ARQPlSWkayrbm6H0FZX2p1gsoz";

    // --- Fetch data from the URL ---
    // Assuming a fetch-like mechanism is available in this environment
    // If not, this part would need adaptation based on the specific environment's capabilities
    console.log(`Workspaceing data from: ${productsUrl}`);
    const response = await fetch(productsUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch data: ${response.status} ${response.statusText}`
      );
    }

    let productsData: Document[] = await response.json();

    const indexName = "products"; // Changed index name

    // --- Define the Index Configuration for Products ---
    const productConfig: IndexConfig = {
      // Use a new string field for the ID, as MiniSearch prefers strings
      idField: "id", // We will create this 'id' field from 'sku'
      fields: [
        "name", // Search by product name
        "description", // Search within description
        "manufacturer", // Search by manufacturer
        "model", // Search by model number
        "category_names", // Search within category names (we'll create this)
        "type", // Search by product type (e.g., HardGood)
        "sku_str", // Allow searching by SKU as text
        "upc", // Allow searching by UPC
      ],
      storeFields: [
        // Fields to return in the search results
        "id", // Return the string ID
        "sku", // Return original SKU number
        "name",
        "price",
        "image",
        "url",
        "manufacturer",
        "model",
        "type",
        "description", // Return description for display if needed
        "category", // Return the original category structure
        "upc",
      ],
    };

    // --- Preprocess data for indexing ---
    // MiniSearch works best with string IDs and benefits from flattened arrays for text search.
    const processedProducts = productsData.map((product) => {
      // 1. Create a stable string ID from SKU
      const stringId = `prod_${product.sku}`;
      // 2. Create a searchable string/array of category names
      const categoryNames =
        product.category?.map(
          (cat: { id: string; name: string }) => cat.name
        ) || [];
      // 3. Convert SKU to string for potential text searching
      const skuStr = String(product.sku);

      return {
        ...product, // Keep original fields
        id: stringId, // Add the new string ID for MiniSearch idField
        category_names: categoryNames, // Add flattened category names for searching
        sku_str: skuStr, // Add SKU as a string for searching
      };
    });

    // Execute indexing with processed data and config
    await indexDocumentsUseCase.execute(
      indexName,
      processedProducts,
      productConfig
    );
    console.log(
      `Successfully loaded and indexed ${processedProducts.length} products into '${indexName}' index.`
    );
  } catch (error) {
    console.error("Error loading initial data:", error);
  }
}
