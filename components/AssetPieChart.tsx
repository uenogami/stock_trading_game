"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AssetPieChartProps {
  cash: number;
  holdings: { [symbol: string]: number };
  stockPrices: { [symbol: string]: number };
  stockNames?: { [symbol: string]: string }; // 銘柄名のマップ
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// カスタムラベルコンポーネント
const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  value,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  // 各セグメントの中央に配置（内側と外側の中間）
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {name}
      <tspan x={x} dy="17" fontSize={13}>
        {`${Math.round(value)}p`}
      </tspan>
    </text>
  );
};

export default function AssetPieChart({
  cash,
  holdings,
  stockPrices,
  stockNames = {},
}: AssetPieChartProps) {
  const data = [
    { name: "現金", value: cash },
    ...Object.entries(holdings).map(([symbol, quantity]) => ({
      name: stockNames[symbol] || `銘柄${symbol}`, // 会社名があれば使用、なければデフォルト
      value: quantity * (stockPrices[symbol] || 0),
    })),
  ].filter((item) => item.value > 0);

  return (
    <div className="w-full max-w-sm mx-auto">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={130}
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

