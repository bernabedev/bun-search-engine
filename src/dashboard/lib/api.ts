import type { SystemStats } from "@/interfaces/system";

export interface IndexConfig {
  idField: string;
  fields: string[];
  storeFields: string[];
}

export interface Index {
  name: string;
  config: IndexConfig;
}

// Search types
export interface SearchParams {
  query?: string;
  filters?: Record<string, string>;
  sortBy?: string[]; // ["price:desc"]
  page?: number;
  limit?: number;
}

export interface SearchResult {
  hits: Array<Record<string, any>>;
  nbHits: number;
  query: string;
  limit: number;
  offset: number;
  processingTimeMs: number;
  totalPages?: number;
  page?: number;
  facetDistribution?: Record<string, Record<string, number>>;
  facetStats?: Record<
    string,
    { min: number; max: number; avg: number; count: number }
  >;
}

export const getCookie = () =>
  document.cookie
    .split(";")
    .find((cookie) => cookie.startsWith(" api-key="))
    ?.split("=")[1];

function http(
  url: string,
  {
    headers,
    method,
    body,
  }: {
    headers: Record<string, string>;
    method: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, any>;
  }
) {
  return fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

// Get all indexes
export async function getIndexes(apiKey: string): Promise<Index[]> {
  const response = await http("/indexes", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch indexes");
  }
  return response.json();
}

// Search an index
export async function searchIndex(
  apiKey: string,
  indexName: string,
  params: SearchParams
): Promise<SearchResult> {
  const response = await http(`/indexes/${indexName}/search`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    method: "POST",
    body: params,
  });
  if (!response.ok) {
    throw new Error("Failed to search index");
  }
  return response.json();
}

// Update an index with documents
export async function updateIndex(
  apiKey: string,
  indexName: string,
  documents: any[]
): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real app, you would make an actual API call to update the index
  console.log(`Updating index ${indexName} with ${documents.length} documents`);
}

// Delete an index
export async function deleteIndex(
  apiKey: string,
  indexName: string
): Promise<void> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // In a real app, you would make an actual API call to delete the index
  console.log(`Deleting index ${indexName}`);
}

export async function fetchSystemStats(apiKey: string): Promise<SystemStats> {
  const response = await fetch("/system/stats", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Failed to fetch system stats" }));
    throw new Error(
      `Error fetching system stats: ${response.status} ${
        response.statusText
      } - ${errorData?.error?.message || errorData.message}`
    );
  }
  return await response.json();
}
