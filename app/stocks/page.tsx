"use client";

import { useEffect, useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import NewsFeed from "@/components/NewsFeed";
import AuthGuard from "@/components/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { gameRules } from "@/config";
import { getLocalUserId } from "@/lib/localAuth";

function StocksContent() {
  const stocks = useGameStore((state) => state.stocks);
  const user = useGameStore((state) => state.user);
  const timelinePosts = useGameStore((state) => state.timelinePosts);
  const cards = useGameStore((state) => state.cards);
  const buyStock = useGameStore((state) => state.buyStock);
  const sellStock = useGameStore((state) => state.sellStock);
  const getCooldownRemaining = useGameStore((state) => state.getCooldownRemaining);
  const isLoading = useGameStore((state) => state.isLoading);
  
  // 保有上限増加カードの効果を適用（+10株）
  const maxHoldingsPlusCard = cards.find((c) => c.id === 'max-holdings-plus' && c.active);
  const maxHoldingsBonus = maxHoldingsPlusCard ? 10 : 0;
  const elapsedMinutes = useGameStore((state) => state.elapsedMinutes);
  const [pricesHidden, setPricesHidden] = useState<boolean | null>(null); // null = 未チェック（非表示にする）
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  
  // 株価非表示カードの効果をチェック（全員、本人含む）
  useEffect(() => {
    const checkHidePrices = async () => {
      const userId = getLocalUserId();
      if (!userId) return;
      
      try {
        const res = await fetch(`/api/hide-prices?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setPricesHidden(data.isHidden || false);
          if (data.isHidden && data.remainingSeconds) {
            setRemainingSeconds(data.remainingSeconds);
          } else {
            setRemainingSeconds(0);
          }
        }
      } catch (error) {
        console.error('Failed to check hide prices:', error);
        // エラー時は非表示を維持（安全側に倒す）
        setPricesHidden(true);
      }
    };
    
    checkHidePrices();
    const interval = setInterval(checkHidePrices, 1000);
    return () => clearInterval(interval);
  }, [cards]);
  const [activeStock, setActiveStock] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState<string>("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // クールダウン表示の更新
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownRemaining(getCooldownRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [getCooldownRemaining]);

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
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-32">
        <h1 className="text-2xl font-bold mb-4 mt-2">銘柄一覧</h1>
        
        <div className="space-y-4">
          {stocks.map((stock) => {
            const holdings = user.holdings[stock.symbol] || 0;
            const holdingsValue = holdings * stock.price;
            const stockRule = gameRules.stocks.find((s) => s.symbol === stock.symbol);
            
            // チャートデータを準備（時間ベース）
            // 経過時間までのデータのみを表示（X軸は60分まで固定）
            const chartData = stock.chartSeries
              .filter((item) => item.minute <= elapsedMinutes)
              .map((item) => ({
                ...item,
                date: item.time, // 既に「X分」形式になっている
              }));
            
            // 銘柄に応じた色を決定
            const borderColor = stock.symbol === "A" 
              ? "border-blue-500 hover:border-blue-600" 
              : "border-red-500 hover:border-red-600";
            const buttonColor = stock.symbol === "A"
              ? "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700";
            const companyColor = stock.symbol === "A"
              ? "blue" // インフラテックは青色
              : "red"; // ネクストラは赤色
            const holdingsTextColor = stock.symbol === "A"
              ? "text-blue-600" // インフラテックは青色
              : "text-red-600"; // ネクストラは赤色
            
            return (
              <div
                key={stock.symbol}
                className={`bg-white border ${borderColor} rounded-lg p-4 hover:shadow-md transition-all`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {stock.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    {pricesHidden !== false ? (
                      <p className="text-2xl font-bold text-gray-400">
                        ???
                      </p>
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">
                        {stock.price}p
                      </p>
                    )}
                  </div>
                </div>

                {/* 企業情報 */}
                {stockRule && (
                  <div className={`mt-3 mb-3 p-3 rounded-lg border ${
                    companyColor === "blue" 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-red-50 border-red-200"
                  }`}>
                    <p className={`text-xs mb-2 leading-relaxed ${
                      companyColor === "blue" 
                        ? "text-blue-900" 
                        : "text-red-900"
                    }`}>
                      {stockRule.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        companyColor === "blue"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-red-200 text-red-800"
                      }`}>
                        {stockRule.flavor.type}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        companyColor === "blue"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-red-200 text-red-800"
                      }`}>
                        {stockRule.flavor.industry}
                      </span>
                      {stockRule.flavor.characteristics.map((char, idx) => (
                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded ${
                          companyColor === "blue"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-red-200 text-red-800"
                        }`}>
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
                        <span className="font-semibold">{stockRule.maxHoldings + maxHoldingsBonus}株</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 株価非表示メッセージ */}
                {pricesHidden === true && remainingSeconds > 0 && (
                  <div className="mt-4 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ 株価は現在非表示です（残り{Math.floor(remainingSeconds / 60)}分{String(remainingSeconds % 60).padStart(2, '0')}秒）
                    </p>
                  </div>
                )}
                
                {/* 株価推移グラフ */}
                {chartData.length > 0 && pricesHidden === false && (
                  <div className="mt-4 mb-3">
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={chartData}>
                        <XAxis 
                          type="number"
                          dataKey="minute" 
                          tick={{ fontSize: 9 }}
                          domain={[0, gameRules.playTime]} // 0-60分で固定
                          ticks={[0, 10, 20, 30, 40, 50, 60]} // 10分刻み
                          tickFormatter={(value) => `${value}分`}
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
                          labelFormatter={(label: string) => `経過時間: ${label}分`}
                          labelStyle={{ fontSize: 12 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke={stock.symbol === "A" ? "#60a5fa" : "#f87171"} // インフラテック（A）は青、ネクストラ（B）は赤
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {holdings > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>保有株数</span>
                      <span className={`font-medium ${holdingsTextColor}`}>
                        {holdings}株 / {stock.maxHoldings + maxHoldingsBonus}株 ({holdingsValue}p)
                      </span>
                    </div>
                  </div>
                )}

                {/* 売買パネル */}
                {activeStock === stock.symbol ? (
                  <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                    {/* クールダウン表示 */}
                    {cooldownRemaining > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
                        <p className="text-xs text-yellow-800 font-medium">
                          ⏱️ クールダウン中: あと {cooldownRemaining}秒
                        </p>
                      </div>
                    )}

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
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                              companyColor === "blue" ? "focus:ring-blue-500" : "focus:ring-red-500"
                            }`}
                            placeholder="株数を半角で入力"
                          />
                          {(() => {
                            const qtyNum = parseInt(quantity) || 0;
                            const totalCost = stock.price * qtyNum;
                            const effectiveMaxHoldings = stock.maxHoldings + maxHoldingsBonus;
                            const wouldExceedMax = holdings + qtyNum > effectiveMaxHoldings;
                            const canBuy = user.cash >= totalCost && qtyNum > 0 && cooldownRemaining === 0 && !wouldExceedMax;
                            return (
                              <>
                                <div className="mt-2 text-sm text-gray-600">
                                  <p>
                                    {pricesHidden !== false ? (
                                      <>単価: ???p × {qtyNum}株 = ???p</>
                                    ) : (
                                      <>単価: {stock.price}p × {qtyNum}株 = {totalCost}p</>
                                    )}
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
                                               最大保有数({effectiveMaxHoldings}株)を超えます
                                             </p>
                                           )}
                                </div>
                                <button
                                  onClick={async () => {
                                    if (canBuy) {
                                      const confirmMessage = `${stock.name}を${qtyNum}株、${totalCost}pで購入しますか？`;
                                      if (window.confirm(confirmMessage)) {
                                        await buyStock(stock.symbol, qtyNum);
                                        setQuantity("");
                                        setActiveStock(null);
                                      }
                                    }
                                  }}
                                  disabled={!canBuy}
                                  className={`w-full mt-3 py-3 rounded-lg font-semibold transition-colors ${
                                    canBuy
                                      ? "bg-green-500 text-white hover:bg-green-600"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                >
                                  購入する
                                </button>
                              </>
                            );
                          })()}
                        </div>
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
                            max={holdings}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${
                              companyColor === "blue" ? "focus:ring-blue-500" : "focus:ring-red-500"
                            }`}
                            placeholder="株数を半角で入力"
                          />
                          {(() => {
                            const qtyNum = parseInt(quantity) || 0;
                            const totalCost = stock.price * qtyNum;
                            const canSell = holdings >= qtyNum && qtyNum > 0 && cooldownRemaining === 0;
                            return (
                              <>
                                <div className="mt-2 text-sm text-gray-600">
                                  <p>
                                    {pricesHidden !== false ? (
                                      <>単価: ???p × {qtyNum}株 = ???p</>
                                    ) : (
                                      <>単価: {stock.price}p × {qtyNum}株 = {totalCost}p</>
                                    )}
                                  </p>
                                  <p className="mt-1">
                                    保有株数: {holdings}株
                                    {!canSell && qtyNum > 0 && (
                                      <span className="text-red-600 ml-2">
                                        (不足: {qtyNum - holdings}株)
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (canSell) {
                                      const confirmMessage = `${stock.name}を${qtyNum}株、${totalCost}pで売却しますか？`;
                                      if (window.confirm(confirmMessage)) {
                                        await sellStock(stock.symbol, qtyNum);
                                        setQuantity("");
                                        setActiveStock(null);
                                      }
                                    }
                                  }}
                                  disabled={!canSell}
                                  className={`w-full mt-3 py-3 rounded-lg font-semibold transition-colors ${
                                    canSell
                                      ? "bg-red-500 text-white hover:bg-red-600"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                >
                                  売却する
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setActiveStock(null);
                        setQuantity("");
                        setActiveTab("buy");
                      }}
                      className="w-full mt-2 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      閉じる
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveStock(stock.symbol)}
                    className={`mt-4 w-full bg-gradient-to-r ${buttonColor} text-white text-center py-3 rounded-lg font-semibold active:scale-95 transition-all shadow-md hover:shadow-lg`}
                  >
                    購入・売却
                  </button>
                )}
              </div>
            );
          })}
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

export default function StocksPage() {
  return (
    <AuthGuard>
      <StocksContent />
    </AuthGuard>
  );
}

