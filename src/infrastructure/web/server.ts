import { serve, type Server } from "bun";
import index from "../../dashboard/index.html";
import { config } from "./config";
import { ApiError } from "./errors/api-error";
import { authenticateRequest } from "./middlewares/auth";
import { routeRequest } from "./router";
import { setupGracefulShutdown } from "./shutdown";
import { loadInitialData } from "./startup";
import { createErrorResponse } from "./utils";

console.log("🚀 Starting Bunflare Server...");

// --- Main Fetch Handler ---
async function fetchHandler(
  request: Request,
  server: Server
): Promise<Response> {
  const url = new URL(request.url);
  const start = performance.now(); // Start timer for request duration

  try {
    // 1. Authentication Middleware
    authenticateRequest(request, url); // Throws error if invalid

    // 2. Routing
    const response = await routeRequest(request, url); // Throws error if not found or handler fails

    // Log successful request duration
    const duration = Math.round(performance.now() - start);
    console.log(
      `➡️ ${request.method} ${url.pathname}${url.search} - ${response.status} (${duration}ms)`
    );

    return response;
  } catch (error) {
    // Handle errors from authentication, routing, or handlers
    const errorResponse = createErrorResponse(error);
    // Log error request duration
    const duration = Math.round(performance.now() - start);
    let logPrefix = "⚠️";
    if (error instanceof ApiError && error.statusCode >= 500) logPrefix = "💥";
    console.log(
      `${logPrefix} ${request.method} ${url.pathname}${url.search} - ${errorResponse.status} (${duration}ms)`
    );

    return errorResponse;
  }
}

// --- Bun Server Initialization ---
const server = serve({
  port: config.port,
  fetch: fetchHandler, // Use the combined handler
  routes: {
    // Serve index.html for all unmatched routes.
    "/": index,
    "/public/*": async (req) => {
      const path = new URL(req.url).pathname;
      const pwd = process.cwd();
      const file = Bun.file(`${pwd}${path}`);
      if (!(await file.exists())) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response(file);
    },
  },
  error(error: Error): Response {
    // Bun's top-level error handler (less likely to be hit with try/catch in fetch)
    console.error("💥 Bun Top-Level Server Error:", error);
    // Use our standard error response format
    return createErrorResponse(
      new Error("An unexpected server error occurred.")
    );
  },
});

console.log(`✅ Server listening on http://localhost:${server.port}`);

// --- Setup Graceful Shutdown ---
setupGracefulShutdown(server);

// --- Load Initial Data (Asynchronously) ---
// Run after server starts listening so it doesn't block startup
loadInitialData();
