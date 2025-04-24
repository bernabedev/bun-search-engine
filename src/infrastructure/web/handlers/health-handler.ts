import { createJsonResponse } from "../utils";

export function handleHealthCheck(request: Request): Response {
  return createJsonResponse({
    status: "ok",
    message: "Bun Search Engine is running!",
  });
}
