import type { SynonymGroup } from "@/core/domain/synonym";
import {
  addSynonymGroupUseCase,
  deleteSynonymUseCase,
  listSynonymsUseCase,
} from "../di";
import { BadRequestError, NotFoundError } from "../errors/api-error";
import { createJsonResponse } from "../utils";

/** POST /synonyms */
export async function handleAddSynonyms(request: Request): Promise<Response> {
  if (request.method !== "POST")
    throw new BadRequestError("Method Not Allowed.");
  try {
    const body: { words: SynonymGroup } = await request.json();
    if (!body || !Array.isArray(body.words)) {
      throw new BadRequestError(
        'Invalid payload: Request body must be a JSON object with a "words" array (e.g., {"words": ["word1", "word2"]}).'
      );
    }
    await addSynonymGroupUseCase.execute(body.words);
    return createJsonResponse(
      { message: `Synonym group processed successfully.` },
      201
    ); // 201 Created or 200 OK if merging
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new BadRequestError("Invalid JSON payload.");
    if (
      error instanceof Error &&
      error.message.includes("at least two strings")
    ) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}

/** GET /synonyms */
export async function handleListSynonyms(request: Request): Promise<Response> {
  if (request.method !== "GET")
    throw new BadRequestError("Method Not Allowed.");
  const groups = await listSynonymsUseCase.execute();
  return createJsonResponse(groups);
}

/** DELETE /synonyms/{word} */
export async function handleDeleteSynonym(
  request: Request,
  word: string
): Promise<Response> {
  if (request.method !== "DELETE")
    throw new BadRequestError("Method Not Allowed.");
  if (!word)
    throw new BadRequestError("Word to delete is required in the path.");

  const deleted = await deleteSynonymUseCase.execute(word);
  if (!deleted) {
    throw new NotFoundError(`Synonym "${word}" not found.`);
  }
  return new Response(null, { status: 204 }); // 204 No Content
}
