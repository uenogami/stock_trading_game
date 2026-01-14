"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import { useGameStore } from "@/store/useGameStore";

export default function IntelPage() {
  const { user, cards, buyCard, useCard } = useGameStore();

  const handleBuyCard = (cardId: string) => {
    if (confirm('このカードを購入しますか？')) {
      buyCard(cardId);
      alert('カードを購入しました');
    }
  };

  const handleUseCard = (cardId: string) => {
    if (confirm('このカードを使用しますか？')) {
      useCard(cardId);
      alert('カードを使用しました');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
        <h1 className="text-2xl font-bold mb-4 mt-2">闇トレーダー（カード）</h1>
        <p className="text-sm text-gray-600 mb-6">
          すべてのカードは1人1回まで購入可能です
        </p>

        <div className="space-y-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {card.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {card.id === 'anonymous-trade' && '次の1回の売買ログが「匿名ユーザー」表記になる'}
                    {card.id === 'fake-info' && '売買ログ風の偽情報を1回投稿可能（「未確認情報」タグ付き）'}
                    {card.id === 'rank-visibility' && '自分の順位をリアルタイムで確認可能（通常は20分ごとにしか順位確認不可）'}
                    {card.id === 'debt-reversal' && '発動後5分間、確定損益のみ反転（マイナス→プラス、プラス→マイナス）'}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-gray-900">{card.price}p</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {!card.purchased ? (
                  <button
                    onClick={() => handleBuyCard(card.id)}
                    disabled={user.cash < card.price}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      user.cash >= card.price
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    購入
                  </button>
                ) : (
                  <>
                    {card.active ? (
                      <div className="flex-1 py-2 px-4 rounded-lg bg-green-100 text-green-800 font-medium text-center">
                        {card.id === 'debt-reversal' && card.expiresAt
                          ? `使用中（あと${Math.ceil((card.expiresAt - Date.now()) / 1000 / 60)}分）`
                          : '使用済み'}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUseCard(card.id)}
                        className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                      >
                        使用する
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← ホームに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}

