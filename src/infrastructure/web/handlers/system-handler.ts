import type { SystemStats } from "@/interfaces/system";
import os from "node:os";
import process from "node:process";
import { createJsonResponse } from "../utils";

export function handleSystemStats(request: Request): Response {
  if (request.method !== "GET") {
    return createJsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const memUsage = process.memoryUsage();
  const loadAvg = os.loadavg(); // [1, 5, 15] minute load averages
  const uptime = process.uptime(); // Uptime in seconds

  const stats: SystemStats = {
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      totalSystem: os.totalmem(), // Get total system memory for context
    },
    cpu: {
      loadAvg: loadAvg,
    },
    bunVersion: Bun.version, // Get Bun version
    uptime: uptime,
  };

  return createJsonResponse(stats);
}
