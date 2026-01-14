"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import AuthGuard from "@/components/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { gameRules } from "@/config";

function StocksContent() {
  const stocks = useGameStore((state) => state.stocks);
  const user = useGameStore((state) => state.user);
  const isLoading = useGameStore((state) => state.isLoading);

  // ローディング中は表示しない
  if (isLoading || stocks.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <TopNavigation />
        </div>
        <main className="pt-20 max-w-md mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
        <h1 className="text-2xl font-bold mb-4 mt-2">銘柄一覧</h1>
        
        <div className="space-y-4">
          {stocks.map((stock) => {
            const holdings = user.holdings[stock.symbol] || 0;
            const holdingsValue = holdings * stock.price;
            const stockRule = gameRules.stocks.find((s) => s.symbol === stock.symbol);
            
            // チャートデータを準備（時間ベース）
            const chartData = stock.chartSeries.map((item) => ({
              ...item,
              date: item.time, // 既に「X分」形式になっている
            }));
            
            return (
              <div
                key={stock.symbol}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {stock.name}
                    </h2>
                    <p className="text-sm text-gray-500">コード: {stock.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {stock.price}p
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        stock.change24h >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stock.change24h >= 0 ? "+" : ""}
                      {stock.change24h}%<span className="text-xs text-gray-500">（開始時比）</span>
                    </p>
                  </div>
                </div>

                {/* 企業情報 */}
                {stockRule && (
                  <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                      {stockRule.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {stockRule.flavor.type}
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {stockRule.flavor.industry}
                      </span>
                      {stockRule.flavor.characteristics.map((char, idx) => (
                        <span key={idx} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>価格変動係数</span>
                        <span className="font-semibold">{stockRule.coefficient}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>最大保有数</span>
                        <span className="font-semibold">{stockRule.maxHoldings}株</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 株価推移グラフ */}
                {chartData.length > 0 && (
                  <div className="mt-4 mb-3">
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={chartData}>
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 9 }}
                          interval={Math.floor(chartData.length / 8)} // 適切な間隔で表示
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          domain={['auto', 'auto']}
                          width={40}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}p`, '価格']}
                          labelFormatter={(label: string) => `経過時間: ${label}`}
                          labelStyle={{ fontSize: 12 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke={stock.change24h >= 0 ? "#10b981" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>出来高</span>
                    <span className="font-medium">{stock.volume}</span>
                  </div>
                  {holdings > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>保有株数</span>
                      <span className="font-medium text-blue-600">
                        {holdings}株 ({holdingsValue}p)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* 購入、売却はこちらボタン */}
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="mt-4 block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                  購入・売却はこちら →
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function StocksPage() {
  return (
    <AuthGuard>
      <StocksContent />
    </AuthGuard>
  );
}

