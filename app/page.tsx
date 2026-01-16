"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import AssetPieChart from "@/components/AssetPieChart";
import NewsFeed from "@/components/NewsFeed";
import AuthGuard from "@/components/AuthGuard";
import { useGameStore } from "@/store/useGameStore";

function HomeContent() {
  // Zustandストアから状態を取得
  const { user, stocks, calculateTotalAsset, timelinePosts } = useGameStore();
  
  // 株価マップと銘柄名マップを作成
  const stockPrices: { [symbol: string]: number } = {};
  const stockNames: { [symbol: string]: string } = {};
  stocks.forEach((stock) => {
    stockPrices[stock.symbol] = stock.price;
    stockNames[stock.symbol] = stock.name;
  });

  // 総資産を計算
  const totalAsset = calculateTotalAsset();

  // 資産内訳を計算
  const assetBreakdown = [
    { name: "現金", value: user.cash },
    ...Object.entries(user.holdings).map(([symbol, quantity]) => ({
      name: stockNames[symbol] || `銘柄${symbol}`,
      value: quantity * (stockPrices[symbol] || 0),
    })),
  ].filter((item) => item.value > 0);

  return (
    <div className="h-screen bg-white relative">
      {/* トップナビゲーション（画面topに固定） */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <TopNavigation />
      </div>
      
      {/* メインコンテンツ（トップナビゲーションとタイムラインの間） */}
      <main className="pt-16 max-w-md mx-auto w-full px-4 h-full overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50">
        {/* メインコンテンツ：資産表示 */}
        <div className="mb-4">
          <AssetPieChart
            cash={user.cash}
            holdings={user.holdings}
            stockPrices={stockPrices}
            stockNames={stockNames}
          />
          
          <div className="mt-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              総資産 {totalAsset}p
            </p>
            {/* 資産内訳 */}
            <div className="mt-2 space-y-1">
              {assetBreakdown.map((asset, index) => {
                const percentage = totalAsset > 0 ? (asset.value / totalAsset) * 100 : 0;
                return (
                  <p key={index} className="text-sm text-gray-600">
                    {asset.name}: {Math.round(asset.value)}p ({percentage.toFixed(1)}%)
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* ショートカットボタン */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/insurance"
            className="bg-gradient-to-b from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-blue-700/20"
          >
            保険適用
          </Link>
          <Link
            href="/stocks"
            className="bg-gradient-to-b from-green-500 to-green-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:from-green-600 hover:to-green-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-green-700/20"
          >
            銘柄売買
          </Link>
          <Link
            href="/intel"
            className="bg-gradient-to-b from-purple-500 to-purple-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:from-purple-600 hover:to-purple-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-purple-700/20"
          >
            能力購入
          </Link>
        </div>
      </main>

      {/* タイムライン（画面bottomに固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
        <div className="max-w-md mx-auto w-full">
          <NewsFeed posts={timelinePosts} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

