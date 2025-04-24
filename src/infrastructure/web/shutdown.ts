import type { Server } from "bun";

export function setupGracefulShutdown(server: Server) {
  const shutdown = (signal: string) => {
    console.log(`\n🚦 Received ${signal}. Starting graceful shutdown...`);
    server.stop(true); // true = wait for connections to close
    console.log("✅ Server stopped gracefully.");
    // Add any other cleanup logic here (e.g., saving in-memory data if needed)
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C
  process.on("SIGTERM", () => shutdown("SIGTERM")); // Kubernetes, systemd, etc.
}
