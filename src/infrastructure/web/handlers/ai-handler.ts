import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { config } from "../config";
import { ApiError, BadRequestError } from "../errors/api-error";
import { createJsonResponse } from "../utils";

// Define the expected output structure using Zod for validation
const indexConfigSchema = z
  .object({
    idField: z
      .string()
      .min(1)
      .describe(
        "The field name recommended as the unique document identifier (string type preferred). If only numeric ID found, suggest creating a new string field like 'index_id' and use that."
      ),
    fields: z
      .array(z.string().min(1))
      .min(1)
      .describe(
        "An array of field names containing text content that should be indexed for full-text search (e.g., name, title, description, brand, category names, tags). Exclude IDs, URLs, image paths unless they are meant for text search. Flatten nested text fields (like category.name to category_name) if appropriate."
      ),
    storeFields: z
      .array(z.string().min(1))
      .min(1)
      .describe(
        "An array of field names whose values should be stored and returned in search results. Include the idField and fields needed for display (like name, price, image, url, key identifiers). This can include fields not in the 'fields' array."
      ),
  })
  .describe(
    "JSON configuration object for a MiniSearch index based on the sample document."
  );

const model = createGoogleGenerativeAI({
  apiKey: config.geminiApiKey,
});

/** POST /ai/generate-config */
export async function handleGenerateConfig(
  request: Request
): Promise<Response> {
  if (request.method !== "POST") {
    throw new BadRequestError("Method Not Allowed.");
  }

  // Check if Gemini integration is configured/enabled
  if (!model) {
    console.error(
      "Attempted to use /ai/generate-config but GEMINI_API_KEY is not set."
    );
    throw new ApiError(
      "AI configuration generation service is not available.",
      503
    ); // 503 Service Unavailable
  }

  let sampleDocument: object;
  try {
    const body = await request.json();
    if (
      !body ||
      typeof body !== "object" ||
      !body.sampleDocument ||
      typeof body.sampleDocument !== "object"
    ) {
      throw new BadRequestError(
        'Invalid payload: Request body must be a JSON object with a "sampleDocument" property containing the sample JSON object.'
      );
    }
    sampleDocument = body.sampleDocument;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new BadRequestError("Invalid JSON payload.");
    throw error;
  }

  const sampleJsonString = JSON.stringify(sampleDocument, null, 2); // Pretty print for the prompt

  // Construct the prompt for the AI
  const prompt = `
      You are an expert assistant helping configure a JavaScript search library called MiniSearch.
      Your task is to analyze the following sample JSON document and generate the optimal MiniSearch index configuration (idField, fields, storeFields) for it.

      **Guidelines for Configuration:**

      1.  **idField:** Identify the most likely unique identifier field. If it's numeric (like 'id' or 'sku'), recommend creating and using a new **string** field (e.g., 'index_id') derived from the numeric one (like 'item_\${id}'). If a good string ID already exists, use that.
      2.  **fields (Searchable Text):** Select fields containing text useful for searching. Include names, descriptions, titles, brands, models, tags, keywords, and flattened category/subcategory names. Exclude pure numeric IDs, URLs, image paths, boolean flags, or timestamps unless searching them as text makes sense.
      3.  **storeFields (Returned Data):** Select fields needed to display a useful search result snippet. Always include the chosen \`idField\`. Often includes names, primary identifiers (like original ID/SKU), price, thumbnail/image URL, brand, model, and maybe a short descriptive field. It's okay to include fields here that are *not* in the searchable \`fields\` list.

      **Sample Document:**
      \\\`\\\`\\\`json
      ${sampleJsonString}
      \\\`\\\`\\\`

      **Generate the MiniSearch configuration object based ONLY on the sample document provided.** Respond ONLY with the JSON configuration object matching the required schema.
    `;

  try {
    console.log("Sending request to Gemini to generate config...");
    const { object: generatedConfig } = await generateObject({
      model: model("gemini-1.5-pro-latest"),
      schema: indexConfigSchema, // Use the Zod schema for output validation
      prompt: prompt,
      mode: "json", // Ensure JSON output mode
    });

    console.log("Received generated config from Gemini:", generatedConfig);

    // The Vercel SDK with Zod already validates the structure
    return createJsonResponse({ config: generatedConfig });
  } catch (error: any) {
    console.error("Error generating index config with AI:", error);
    // Check for specific API errors if needed
    if (error.message?.includes("API key not valid")) {
      throw new ApiError(
        "AI service authentication failed. Check GEMINI_API_KEY.",
        500
      );
    }
    throw new ApiError(
      `Failed to generate configuration via AI: ${error.message}`,
      500
    );
  }
}
