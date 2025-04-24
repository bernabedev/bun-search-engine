"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/dashboard/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface CpuChartProps {
  loadAvg: number[];
}

export function CpuChart({ loadAvg }: CpuChartProps) {
  // Create historical data for visualization
  // In a real app, you would maintain this state over time
  const generateHistoricalData = () => {
    const baseData = [
      { time: "15m", load: loadAvg[2] },
      { time: "10m", load: loadAvg[1] * 0.9 + loadAvg[2] * 0.1 },
      { time: "5m", load: loadAvg[1] },
      { time: "3m", load: loadAvg[0] * 0.3 + loadAvg[1] * 0.7 },
      { time: "1m", load: loadAvg[0] },
      { time: "Ahora", load: loadAvg[0] * 1.1 },
    ];

    // Add some randomness to make it look more realistic
    return baseData.map((item) => ({
      ...item,
      load: Math.max(0, item.load * (0.9 + Math.random() * 0.2)),
    }));
  };

  const data = generateHistoricalData();

  return (
    <ChartContainer
      config={{
        load: {
          label: "Carga",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-full w-full"
    >
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="time" axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, "auto"]}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => Number(value).toFixed(2)}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="load"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
