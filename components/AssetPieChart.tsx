"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface AssetPieChartProps {
  cash: number;
  holdings: { [symbol: string]: number };
  stockPrices: { [symbol: string]: number };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AssetPieChart({
  cash,
  holdings,
  stockPrices,
}: AssetPieChartProps) {
  const data = [
    { name: "現金", value: cash },
    ...Object.entries(holdings).map(([symbol, quantity]) => ({
      name: `銘柄${symbol}`,
      value: quantity * (stockPrices[symbol] || 0),
    })),
  ].filter((item) => item.value > 0);

  return (
    <div className="w-full max-w-sm mx-auto">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-sm text-gray-600 mt-2">所有資産円グラフ</p>
    </div>
  );
}

