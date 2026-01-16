"use client";

import { useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import NewsFeed from "@/components/NewsFeed";
import { useGameStore } from "@/store/useGameStore";
import { gameRules } from "@/config";
import { getLocalUserId } from "@/lib/localAuth";

export default function IntelPage() {
  const { user, cards, timelinePosts, buyCard, activateCard, addTimelinePost } = useGameStore();
  const [fakeInfoStock, setFakeInfoStock] = useState<"A" | "B">("A");
  const [fakeInfoQuantity, setFakeInfoQuantity] = useState<string>("");
  const [fakeInfoType, setFakeInfoType] = useState<"buy" | "sell">("buy");
  const [showFakeInfoForm, setShowFakeInfoForm] = useState<string | null>(null);

  // 前提条件チェック
  const checkPrerequisite = (cardId: string): boolean => {
    const cardRule = gameRules.cards.find((c) => c.id === cardId);
    if (!cardRule?.requiresPrerequisite || !cardRule.prerequisiteCardId) {
      return true;
    }
    const prerequisiteCard = cards.find((c) => c.id === cardRule.prerequisiteCardId);
    return prerequisiteCard?.purchased === true;
  };

  const handleBuyCard = async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    // 偽情報投稿カードは購入時にフォームを表示
    if (cardId === 'fake-info') {
      setShowFakeInfoForm(cardId);
      return;
    }

    const confirmMessage = `${card.name}を${card.price}pで購入しますか？\n（購入後、任意のタイミングで発動できます）`;
    if (window.confirm(confirmMessage)) {
      await buyCard(cardId);
    }
  };

  const handleSubmitFakeInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(fakeInfoQuantity);
    if (!quantity || quantity <= 0) return;

    const userId = getLocalUserId();
    if (!userId) return;

    // 銘柄名を取得
    const stockName = fakeInfoStock === "A" ? "インフラテック" : "ネクストラ";
    const tradeType = fakeInfoType === "buy" ? "購入" : "売却";

    // 偽情報をタイムラインに投稿（取引ログ風）
    await addTimelinePost({
      userId: user.id,
      userName: user.name,
      type: 'trade-log',
      text: `${user.name}が${stockName}を${quantity}株${tradeType}しました`,
    });

    // カードを購入（購入時に自動でactiveになる）
    await buyCard('fake-info');

    // フォームをリセット
    setFakeInfoStock("A");
    setFakeInfoQuantity("");
    setFakeInfoType("buy");
    setShowFakeInfoForm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-purple-800/50">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-32">
        <h1 className="text-2xl font-bold mb-4 mt-2 text-white">能力購入</h1>
        <p className="text-sm text-purple-200 mb-6">
          すべての能力は1人1回まで購入可能です<br />
          資産差表示等の能力はマイページのリアルタイムイベント欄で確認できます
        </p>

        <div className="space-y-4">
          {cards.map((card) => {
            const cardRule = gameRules.cards.find((c) => c.id === card.id);
            return (
            <div
              key={card.id}
              className="bg-gray-800/80 border border-purple-700/50 rounded-lg p-4 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all backdrop-blur-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-200 mb-1">
                    {card.name}
                  </h3>
                  <p className="text-sm text-gray-300 mb-2 leading-relaxed">
                    {cardRule?.description || ''}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-yellow-400">{card.price}p</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {!card.purchased ? (
                  <>
                    {card.id === 'fake-info' && showFakeInfoForm === card.id ? (
                      <form onSubmit={handleSubmitFakeInfo} className="flex-1 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">銘柄</label>
                          <select
                            value={fakeInfoStock}
                            onChange={(e) => setFakeInfoStock(e.target.value as "A" | "B")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="A">インフラテック</option>
                            <option value="B">ネクストラ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">数量（半角数字）</label>
                          <input
                            type="number"
                            min="1"
                            value={fakeInfoQuantity}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setFakeInfoQuantity(value);
                            }}
                            placeholder="株数を入力"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">取引タイプ</label>
                          <select
                            value={fakeInfoType}
                            onChange={(e) => setFakeInfoType(e.target.value as "buy" | "sell")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="buy">購入</option>
                            <option value="sell">売却</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!fakeInfoQuantity || parseInt(fakeInfoQuantity) <= 0 || user.cash < card.price}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
                              fakeInfoQuantity && parseInt(fakeInfoQuantity) > 0 && user.cash >= card.price
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {user.cash < card.price ? 'ポイントが足りません' : '購入・投稿'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowFakeInfoForm(null);
                              setFakeInfoStock("A");
                              setFakeInfoQuantity("");
                              setFakeInfoType("buy");
                            }}
                            className="flex-1 py-2 px-4 rounded-lg bg-gray-300 text-gray-700 font-medium hover:bg-gray-400 transition-colors text-sm"
                          >
                            キャンセル
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => handleBuyCard(card.id)}
                        disabled={user.cash < card.price || (cardRule?.requiresPrerequisite && !checkPrerequisite(card.id))}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                          user.cash >= card.price && (!cardRule?.requiresPrerequisite || checkPrerequisite(card.id))
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {user.cash < card.price 
                          ? 'ポイントが足りません' 
                          : (cardRule?.requiresPrerequisite && !checkPrerequisite(card.id))
                            ? '資産差表示を購入者のみ購入可能'
                            : '購入'}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {card.id === 'fake-info' ? (
                      // 偽情報投稿カードは購入時に投稿済みなので、発動ボタンは不要
                      <div className="flex-1 py-2 px-4 rounded-lg bg-green-100 text-green-800 font-medium text-center">
                        購入済み
                      </div>
                    ) : !card.active ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`${card.name}を発動しますか？`)) {
                            activateCard(card.id);
                          }
                        }}
                        className="flex-1 py-2 px-4 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
                      >
                        発動
                      </button>
                    ) : (
                      <div className="flex-1 py-2 px-4 rounded-lg bg-green-100 text-green-800 font-medium text-center">
                        {card.expiresAt && card.expiresAt > Date.now()
                          ? `発動中（あと${Math.ceil((card.expiresAt - Date.now()) / 1000 / 60)}分）`
                          : '発動済み'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
          })}
        </div>
      </main>

      {/* タイムライン（画面bottomに固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-purple-800/50 bg-gray-900/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto w-full">
          <NewsFeed posts={timelinePosts} />
        </div>
      </div>
    </div>
  );
}
