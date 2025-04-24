"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/dashboard/components/ui/chart";
import { formatBytes } from "@/dashboard/lib/formatters";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface MemoryChartProps {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    totalSystem?: number;
  };
}

export function MemoryChart({ memory }: MemoryChartProps) {
  const data = [
    { name: "RSS", value: memory.rss },
    { name: "Heap Total", value: memory.heapTotal },
    { name: "Heap Usado", value: memory.heapUsed },
    { name: "Externo", value: memory.external },
    { name: "Array Buffers", value: memory.arrayBuffers },
  ];

  return (
    <ChartContainer
      config={{
        value: {
          label: "Memoria",
          color: "var(--chart-1)",
        },
      }}
      className="h-full"
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => formatBytes(value, 0)} width={80} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatBytes(Number(value))}
            />
          }
        />
        <Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ChartContainer>
  );
}
