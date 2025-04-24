import { ApiError, UnauthorizedError } from "./errors/api-error";

export function createJsonResponse(
  data: any,
  status = 200,
  headers?: HeadersInit
): Response {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(headers || {}),
    },
  });
}

export function createErrorResponse(error: unknown): Response {
  let message = "Internal Server Error";
  let statusCode = 500;

  if (error instanceof ApiError) {
    message = error.message;
    statusCode = error.statusCode;
  } else if (error instanceof Error) {
    message = error.message; // Use the actual error message
    console.error("Unhandled Error:", error); // Log internal errors for debugging
  } else {
    console.error("Unknown error object:", error); // Handle non-Error objects thrown
  }

  // Log specific error types if needed for monitoring
  if (error instanceof UnauthorizedError) {
    console.warn(`🔒 Unauthorized access attempt: ${message}`);
  } else if (!(error instanceof ApiError)) {
    // Log unexpected internal errors more prominently
    console.error(`💥 Unexpected Internal Error: ${message}`, error);
  }

  return createJsonResponse({ error: { message, statusCode } }, statusCode);
}
