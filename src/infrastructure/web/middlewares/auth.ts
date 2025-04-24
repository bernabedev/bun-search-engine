import { config } from "../config";
import { UnauthorizedError } from "../errors/api-error";

const publicPaths = ["/", "/dashboard"];

/**
 * Middleware to authenticate requests using the API Key from config.
 * Throws UnauthorizedError if authentication fails.
 * Allows public access to the root health check endpoint.
 */
export function authenticateRequest(request: Request, url: URL): void {
  // Allow public access to the health check endpoint
  if (publicPaths.includes(url.pathname) && request.method === "GET") {
    return; // Skip authentication for health check
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError(
      'Missing or malformed Authorization header. Use "Bearer YOUR_API_KEY".'
    );
  }

  const providedKey = authHeader.substring(7); // Remove "Bearer " prefix

  if (providedKey !== config.apiKey) {
    throw new UnauthorizedError("Invalid API Key.");
  }
}
