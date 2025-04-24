import type { SearchParams, SuggestParams } from "@/interfaces/search";
import { searchUseCase, suggestUseCase } from "../di";
import { BadRequestError } from "../errors/api-error";
import { createJsonResponse } from "../utils";

// --- Search Handler ---
export async function handleSearch(
  request: Request,
  indexName: string,
  url: URL
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "POST") {
    throw new BadRequestError("Method Not Allowed for search.");
  }

  let params: SearchParams;

  if (request.method === "GET") {
    const query = url.searchParams.get("query");
    // Allow empty query for filtering/browsing
    // if (query === null) throw new BadRequestError('Missing required query parameter: query');

    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const filter: Record<string, any> = {};
    const filterRegex = /^filter\[([^:]+)(?::(gt|gte|lt|lte))?\]$/;
    const facets = url.searchParams.getAll("facets") || undefined;
    const sortBy = url.searchParams.getAll("sortBy") || undefined;

    for (const [key, value] of url.searchParams.entries()) {
      const match = key.match(filterRegex);
      if (match) {
        const field = match[1];
        const operator = match[2];
        let parsedValue: any = value;
        if (operator || !isNaN(Number(value))) {
          const num = parseFloat(value);
          if (!isNaN(num)) parsedValue = num;
          else if (operator) continue;
        } else if (
          value.toLowerCase() === "true" ||
          value.toLowerCase() === "false"
        ) {
          parsedValue = value.toLowerCase() === "true";
        }

        if (operator) {
          if (!filter[field] || typeof filter[field] !== "object")
            filter[field] = {};
          filter[field][operator] = parsedValue;
        } else {
          filter[field] = parsedValue;
        }
      }
    }

    params = {
      query: query ?? "", // Default to empty string if null
      offset: isNaN(offset) ? 0 : offset,
      limit: isNaN(limit) ? 10 : limit,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      sortBy: sortBy && sortBy.length > 0 ? sortBy : undefined,
      facets: facets ? facets : undefined,
    };
  } else {
    // POST request
    try {
      const body = await request.json();
      // Allow empty query string in POST body as well
      params = {
        query: body.query ?? "",
        offset: body.offset ?? 0,
        limit: body.limit ?? 10,
        filter: body.filter,
        sortBy: body.sortBy,
        facets: body.facets,
      };
      if (params.sortBy && !Array.isArray(params.sortBy)) {
        throw new BadRequestError(
          'Invalid "sortBy" field in body: must be an array of strings (e.g., ["field:asc", "field:desc"]).'
        );
      }
      if (params.sortBy) {
        for (const sortItem of params.sortBy) {
          if (
            typeof sortItem !== "string" ||
            !sortItem.match(/^[^:]+(:(?:asc|desc))?$/)
          ) {
            throw new BadRequestError(
              `Invalid format in sortBy array: "${sortItem}". Use "fieldName" or "fieldName:asc" or "fieldName:desc".`
            );
          }
        }
      }
      if (params.facets && !Array.isArray(params.facets)) {
        throw new BadRequestError(
          'Invalid "facets" field in body: must be an array of strings.'
        );
      }
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new BadRequestError("Invalid JSON payload for POST search.");
      throw error;
    }
  }

  const results = await searchUseCase.execute(indexName, params);
  return createJsonResponse(results);
}

// --- Suggest Handler ---
export async function handleSuggest(
  request: Request,
  indexName: string,
  url: URL
): Promise<Response> {
  if (request.method !== "GET")
    throw new BadRequestError("Method Not Allowed for suggestions.");

  const query = url.searchParams.get("query");
  if (query === null)
    throw new BadRequestError("Missing required query parameter: query");

  const limit = parseInt(url.searchParams.get("limit") || "5", 10);
  // Basic filter parsing (can share logic with search if it gets complex)
  const filter: Record<string, any> = {};
  const filterRegex = /^filter\[([^:]+)(?::(gt|gte|lt|lte))?\]$/; // Allow same filter syntax
  for (const [key, value] of url.searchParams.entries()) {
    const match = key.match(filterRegex);
    if (match) {
      // Reuse parsing logic if needed, simplified here
      const field = match[1];
      const operator = match[2];
      let parsedValue: any = value;
      if (operator || !isNaN(Number(value))) {
        const num = parseFloat(value);
        if (!isNaN(num)) parsedValue = num;
        else if (operator) continue;
      } else if (
        value.toLowerCase() === "true" ||
        value.toLowerCase() === "false"
      ) {
        parsedValue = value.toLowerCase() === "true";
      }
      if (operator) {
        if (!filter[field] || typeof filter[field] !== "object")
          filter[field] = {};
        filter[field][operator] = parsedValue;
      } else {
        filter[field] = parsedValue;
      }
    }
  }

  const params: SuggestParams = {
    query,
    limit: isNaN(limit) ? 5 : limit,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  };

  const results = await suggestUseCase.execute(indexName, params);
  return createJsonResponse(results);
}
