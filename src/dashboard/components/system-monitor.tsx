import type { SystemStats } from "@/interfaces/system";
import { useEffect, useState } from "react";
import { fetchSystemStats, getCookie } from "../lib/api";
import { formatBytes, formatSeconds } from "../lib/formatters";

const POLLING_INTERVAL_MS = 5000;

export function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    // Don't show loading indicator on subsequent polls
    // isLoading.value = !stats.value; // Only set loading true on first load
    setError(null);
    try {
      const apiKey = getCookie();
      if (!apiKey) {
        throw new Error("API key not found");
      }
      const res = await fetchSystemStats(apiKey);
      setStats(res);
    } catch (err: any) {
      console.error("System stats fetch error:", err);
      setError(err.message || "Failed to load system stats.");
      // Optionally clear stats on error: stats.value = null;
    } finally {
      setIsLoading(false); // Always set loading false after attempt
    }
  }

  useEffect(() => {
    loadStats();
    const intervalId = setInterval(loadStats, POLLING_INTERVAL_MS);
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200 mt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-3">
        System Monitor
      </h2>
      {isLoading && <p className="text-sm text-gray-600">Loading...</p>}
      {error && (
        <p className="text-sm text-red-500">Error loading stats: {error}</p>
      )}
      {!isLoading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Bun Version:</span>{" "}
              {stats.bunVersion}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Uptime:</span>{" "}
              {formatSeconds(stats.uptime)}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-800">Memory (Process):</p>
            <ul className="list-disc list-inside ml-2 text-gray-600">
              <li>RSS: {formatBytes(stats.memory.rss)}</li>
              <li>Heap Used: {formatBytes(stats.memory.heapUsed)}</li>
              <li>Heap Total: {formatBytes(stats.memory.heapTotal)}</li>
              {stats.memory.totalSystem && (
                <li className="mt-1 pt-1 border-t border-gray-200">
                  <span className="text-gray-500">
                    Total System: {formatBytes(stats.memory.totalSystem)}
                  </span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-800">CPU Load Average:</p>
            <ul className="list-disc list-inside ml-2 text-gray-600">
              <li>1 min: {stats.cpu.loadAvg[0].toFixed(2)}</li>
              <li>5 min: {stats.cpu.loadAvg[1].toFixed(2)}</li>
              <li>15 min: {stats.cpu.loadAvg[2].toFixed(2)}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
