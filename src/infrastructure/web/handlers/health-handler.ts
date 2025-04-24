import { createJsonResponse } from "../utils";

export function handleHealthCheck(request: Request): Response {
  return createJsonResponse({
    status: "ok",
    message: "Bunflare is running!",
  });
}
