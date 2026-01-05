"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import AssetPieChart from "@/components/AssetPieChart";
import NewsFeed from "@/components/NewsFeed";
import { mockUser, mockStocks, mockTimelinePosts } from "@/fixtures/mockData";

export default function Home() {
  const stockPrices: { [symbol: string]: number } = {};
  mockStocks.forEach((stock) => {
    stockPrices[stock.symbol] = stock.price;
  });

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {/* メインコンテンツ：資産表示 */}
        <div className="mb-6">
          <AssetPieChart
            cash={mockUser.cash}
            holdings={mockUser.holdings}
            stockPrices={stockPrices}
          />
          
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              総資産 {mockUser.totalAsset}p
            </p>
            <p
              className={`text-lg mt-1 ${
                mockUser.delta24h >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              前日比 {mockUser.delta24h >= 0 ? "+" : ""}
              {mockUser.delta24h}p
            </p>
          </div>
        </div>

        {/* ショートカットボタン */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link
            href="/insurance"
            className="bg-blue-500 text-white px-4 py-3 rounded-lg text-center font-medium hover:bg-blue-600 transition-colors"
          >
            保険
          </Link>
          <Link
            href="/stocks"
            className="bg-green-500 text-white px-4 py-3 rounded-lg text-center font-medium hover:bg-green-600 transition-colors"
          >
            銘柄一覧
          </Link>
          <Link
            href="/intel"
            className="bg-purple-500 text-white px-4 py-3 rounded-lg text-center font-medium hover:bg-purple-600 transition-colors"
          >
            情報売買
          </Link>
        </div>

        {/* ニュース/イベントフィード */}
        <NewsFeed posts={mockTimelinePosts} />
      </main>
    </div>
  );
}

