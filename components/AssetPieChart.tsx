"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface AssetPieChartProps {
  cash: number;
  holdings: { [symbol: string]: number };
  stockPrices: { [symbol: string]: number };
  stockNames?: { [symbol: string]: string }; // 銘柄名のマップ
}

// 柔らかい配色：現金（黄色）、インフラテック（青色）、ネクストラ（赤色）
const COLORS: { [key: string]: string } = {
  "現金": "#fbbf24", // 柔らかい黄色
  "インフラテック": "#60a5fa", // 柔らかい青
  "ネクストラ": "#f87171", // 柔らかい赤
};

// 文字色のマッピング（背景色に応じて読みやすい色を選択）
const TEXT_COLORS: { [key: string]: string } = {
  "現金": "#1f2937", // 黄色背景には濃いグレー（黒に近い）
  "インフラテック": "#1f2937", // 青色背景には白色
  "ネクストラ": "#1f2937", // 赤色背景には白色
};

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
  
  // 名前に対応する文字色を取得
  const textColor = TEXT_COLORS[name] || "#ffffff";

  return (
    <text
      x={x}
      y={y}
      fill={textColor}
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
            {data.map((entry, index) => {
              // 名前から色を取得、なければデフォルト色を使用
              const color = COLORS[entry.name] || "#94a3b8";
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                />
              );
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

