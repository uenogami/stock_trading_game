"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import AuthGuard from "@/components/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { gameRules } from "@/config";
import { getLocalUserId } from "@/lib/localAuth";

function StockDetailContent() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  const user = useGameStore((state) => state.user);
  const stocks = useGameStore((state) => state.stocks);
  const buyStock = useGameStore((state) => state.buyStock);
  const sellStock = useGameStore((state) => state.sellStock);
  const getCooldownRemaining = useGameStore((state) => state.getCooldownRemaining);
  
  const stock = stocks.find((s) => s.symbol === symbol);
  const stockRule = gameRules.stocks.find((s) => s.symbol === symbol);

  const [quantity, setQuantity] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  
  // クールダウン残り時間をリアルタイムで表示（1秒ごとに更新）
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // クールダウン表示の更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownRemaining(getCooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stock) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <TopNavigation />
        </div>
        <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
          <p className="text-gray-600 mt-2">銘柄が見つかりません</p>
          <Link
            href="/stocks"
            className="text-blue-600 hover:text-blue-800 underline mt-4 inline-block"
          >
            ← 銘柄一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  const currentHoldings = user.holdings[symbol] || 0;
  const qtyNum = parseInt(quantity) || 0;
  const totalCost = stock.price * qtyNum;
  const isCooldown = cooldownRemaining > 0;
  const maxHoldingsReached = currentHoldings >= stock.maxHoldings;
  const wouldExceedMax = currentHoldings + qtyNum > stock.maxHoldings;
  const canBuy = user.cash >= totalCost && qtyNum > 0 && !isCooldown && !wouldExceedMax;
  const canSell = currentHoldings >= qtyNum && qtyNum > 0 && !isCooldown;

  const handleBuy = async () => {
    if (canBuy) {
      const confirmMessage = `${stock.name}を${qtyNum}株、${totalCost}pで購入しますか？`;
      if (window.confirm(confirmMessage)) {
        await buyStock(symbol, qtyNum);
        setQuantity("");
        // リアルタイム同期で自動更新されるので、再読み込みは不要
      }
    }
  };

  const handleSell = async () => {
    if (canSell) {
      const confirmMessage = `${stock.name}を${qtyNum}株、${totalCost}pで売却しますか？`;
      if (window.confirm(confirmMessage)) {
        await sellStock(symbol, qtyNum);
        setQuantity("");
        // リアルタイム同期で自動更新されるので、再読み込みは不要
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
        {/* 銘柄情報 */}
        <div className="mb-6">
          <Link
            href="/stocks"
            className="text-blue-600 hover:text-blue-800 underline mb-4 inline-block"
          >
            ← 銘柄一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold mb-2 mt-2">{stock.name}</h1>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">現在価格</span>
              <span className="text-2xl font-bold text-gray-900">
                {stock.price}p
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">開始時変化率</span>
              <span
                className={`font-semibold ${
                  stock.change24h >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stock.change24h >= 0 ? "+" : ""}
                {stock.change24h}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">出来高</span>
              <span className="text-gray-900">{stock.volume}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">保有株数</span>
                <span className="text-lg font-semibold text-gray-900">
                  {currentHoldings}株 / {stock.maxHoldings}株
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">保有評価額</span>
                <span className="text-lg font-semibold text-gray-900">
                  {currentHoldings * stock.price}p
                </span>
              </div>
              {maxHoldingsReached && (
                <div className="mt-2 text-sm text-orange-600 font-medium">
                  ⚠️ 最大保有数に達しています
                </div>
              )}
            </div>
          </div>
        </div>

        {/* クールダウン表示 */}
        {isCooldown && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 font-medium">
              ⏱️ クールダウン中: あと {cooldownRemaining}秒
            </p>
          </div>
        )}

        {/* 売買パネル */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "buy"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              購入
            </button>
            <button
              onClick={() => setActiveTab("sell")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === "sell"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              売却
            </button>
          </div>

          {activeTab === "buy" ? (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入数量
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="株数を半角で入力"
                />
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    単価: {stock.price}p × {qtyNum}株 = {totalCost}p
                  </p>
                  <p className="mt-1">
                    所持金: {user.cash}p
                    {user.cash < totalCost && qtyNum > 0 && (
                      <span className="text-red-600 ml-2">
                        (不足: {totalCost - user.cash}p)
                      </span>
                    )}
                  </p>
                  {wouldExceedMax && qtyNum > 0 && (
                    <p className="mt-1 text-red-600">
                      最大保有数({stock.maxHoldings}株)を超えます
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleBuy}
                disabled={!canBuy}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  canBuy
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                購入する
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  売却数量
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentHoldings}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="株数を半角で入力"
                />
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    単価: {stock.price}p × {qtyNum}株 = {totalCost}p
                  </p>
                  <p className="mt-1">
                    保有株数: {currentHoldings}株
                    {!canSell && qtyNum > 0 && (
                      <span className="text-red-600 ml-2">
                        (不足: {qtyNum - currentHoldings}株)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSell}
                disabled={!canSell}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  canSell
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                売却する
              </button>
            </div>
          )}
        </div>

        {/* 企業情報 */}
        {stockRule && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-3">企業情報</h2>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {stockRule.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {stockRule.flavor.type}
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {stockRule.flavor.industry}
              </span>
              {stockRule.flavor.characteristics.map((char, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {char}
                </span>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>価格変動係数</span>
                <span className="font-semibold">{stockRule.coefficient}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>最大保有数</span>
                <span className="font-semibold">{stockRule.maxHoldings}株</span>
              </div>
            </div>
          </div>
        )}

        {/* 発表予定・公式情報 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">発表予定</h2>
          <p className="text-sm text-gray-600">
            現在、発表予定のイベントはありません。
          </p>
        </div>
      </main>
    </div>
  );
}

export default function StockDetailPage() {
  return (
    <AuthGuard>
      <StockDetailContent />
    </AuthGuard>
  );
}


