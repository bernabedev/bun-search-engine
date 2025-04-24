import { indexRepository } from "../di";
import { BadRequestError } from "../errors/api-error";
import { createJsonResponse } from "../utils";

export async function handleListIndexes(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    throw new BadRequestError("Method Not Allowed for listing indexes.");
  }
  const indexNames = await indexRepository.listIndexes();
  const configs = await Promise.all(
    indexNames.map((name) =>
      indexRepository.getIndexConfig(name).then((config) => ({ name, config }))
    )
  );
  return createJsonResponse(configs);
}
