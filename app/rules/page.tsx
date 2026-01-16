"use client";

import TopNavigation from "@/components/TopNavigation";
import NewsFeed from "@/components/NewsFeed";
import { useGameStore } from "@/store/useGameStore";
import { gameRules } from "@/config";

export default function RulesPage() {
  const timelinePosts = useGameStore((state) => state.timelinePosts);
  
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-32">
        <h1 className="text-2xl font-bold mb-6 mt-2">特別ルール</h1>

        {/* プレイ概要 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">プレイ概要</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">プレイ時間：</span>{gameRules.playTime}分
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">参加人数：</span>{gameRules.participantCount}人想定
            </p>
          </div>
        </section>

        {/* 勝利条件 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">勝利条件</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700">
              終了時点での「総資産」が最も高いプレイヤーが勝利
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">総資産：</span>現金と保有株式の時価総額の合算
            </p>
          </div>
        </section>

        {/* 初期設定 */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">初期設定</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">初期資産（全員共通）：</span>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 ml-2 space-y-1">
              <li>現金：{gameRules.initialCash.toLocaleString()}p</li>
              <li>A銘柄：{gameRules.initialHoldings.A}株（{gameRules.initialHoldings.A * gameRules.stocks[0].initialPrice}p）</li>
              <li>B銘柄：{gameRules.initialHoldings.B}株（{gameRules.initialHoldings.B * gameRules.stocks[1].initialPrice}p）</li>
            </ul>
            <p className="text-sm font-semibold text-gray-900 mt-2">
              総資産：10,000p
            </p>
          </div>
        </section>

        {/* 売買ルール */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">売買ルール</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>売買はいつでも可能</li>
              <li>売買後は{Math.round(gameRules.trading.cooldownMinutes * 60)}秒間のクールダウン</li>
              <li>最大保有数制限あり（A銘柄：{gameRules.stocks[0].maxHoldings}株、B銘柄：{gameRules.stocks[1].maxHoldings}株）</li>
              <li>売買手数料なし</li>
            </ul>
          </div>
        </section>

        {/* 保険ルール */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">救済・保険ルール</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700">
              総資産が <span className="font-bold text-red-600">{gameRules.insurance.threshold}p以下</span> になった場合、1回のみ保険発動可能
            </p>
            <p className="text-sm text-gray-700">
              即時 <span className="font-bold text-green-600">{gameRules.insurance.amount.toLocaleString()}p</span> 付与
            </p>
          </div>
        </section>

        {/* リアルタイムイベント */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-900">リアルタイムイベント（デモ版）</h2>
          <div className="space-y-3">
            {gameRules.events.map((event, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {event.time}分経過
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{event.description}</p>
                <ul className="list-disc list-inside text-xs text-gray-700 ml-2">
                  {event.effects.map((effect, i) => (
                    <li key={i}>{effect}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
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

