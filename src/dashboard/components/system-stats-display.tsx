"use client";

import { CpuChart } from "@/dashboard/components/charts/cpu-chart";
import { MemoryChart } from "@/dashboard/components/charts/memory-chart";
import { Button } from "@/dashboard/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/dashboard/components/ui/card";
import { formatBytes, formatUptime } from "@/dashboard/lib/formatters";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchSystemStats, getCookie } from "../lib/api";

export interface SystemStats {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    totalSystem?: number;
  };
  cpu: {
    loadAvg: number[];
  };
  bunVersion: string;
  uptime: number;
}

export function SystemStatsDisplay() {
  const [stats, setStats] = useState<SystemStats>();
  const [loading, setLoading] = useState(false);
  const cookie = getCookie();

  // In a real application, this would fetch data from an API
  const fetchStats = async () => {
    setLoading(true);
    try {
      if (!cookie) {
        throw new Error("No API key found");
      }
      const res = await fetchSystemStats(cookie);
      setStats(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up interval for periodic updates (every 10 seconds)
    const intervalId = setInterval(fetchStats, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="w-full mt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">Estadísticas del Sistema</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-4">
          {/* General Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Versión de Bun
                  </p>
                  <p className="text-lg font-bold">{stats.bunVersion}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tiempo de actividad
                  </p>
                  <p className="text-lg font-bold">
                    {formatUptime(stats.uptime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CPU Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Carga de CPU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <CpuChart loadAvg={stats.cpu.loadAvg} />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    1 min
                  </p>
                  <p className="text-xl font-bold">
                    {stats.cpu.loadAvg[0].toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    5 min
                  </p>
                  <p className="text-xl font-bold">
                    {stats.cpu.loadAvg[1].toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    15 min
                  </p>
                  <p className="text-xl font-bold">
                    {stats.cpu.loadAvg[2].toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage Card (Full Width) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Uso de Memoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <MemoryChart memory={stats.memory} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    RSS
                  </p>
                  <p className="text-sm font-bold">
                    {formatBytes(stats.memory.rss)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Heap Total
                  </p>
                  <p className="text-sm font-bold">
                    {formatBytes(stats.memory.heapTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Heap Usado
                  </p>
                  <p className="text-sm font-bold">
                    {formatBytes(stats.memory.heapUsed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Externo
                  </p>
                  <p className="text-sm font-bold">
                    {formatBytes(stats.memory.external)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Array Buffers
                  </p>
                  <p className="text-sm font-bold">
                    {formatBytes(stats.memory.arrayBuffers)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
