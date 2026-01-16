"use client";

import TopNavigation from "@/components/TopNavigation";
import AuthGuard from "@/components/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { useState } from "react";

function TimelineContent() {
  const { timelinePosts, addTimelinePost, user } = useGameStore();
  const [newPostText, setNewPostText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    await addTimelinePost({
      userId: user.id,
      userName: user.name,
      type: 'tweet',
      text: newPostText,
    });

    setNewPostText("");
  };

  // 取引ログから銘柄と取引タイプを判定
  const getTradeLogInfo = (text: string) => {
    const isInfratech = text.includes('インフラテック');
    const isNextra = text.includes('ネクストラ');
    const isBuy = text.includes('購入');
    const isSell = text.includes('売却');
    
    if (isInfratech && isBuy) return { stock: 'A', type: 'buy' };
    if (isInfratech && isSell) return { stock: 'A', type: 'sell' };
    if (isNextra && isBuy) return { stock: 'B', type: 'buy' };
    if (isNextra && isSell) return { stock: 'B', type: 'sell' };
    return null;
  };

  // タグの色を決定
  const getTagStyle = (post: typeof timelinePosts[0]) => {
    if (post.type === 'system') {
      return 'bg-gray-200 text-gray-800';
    }
    if (post.type === 'tweet') {
      return 'bg-gray-100 text-gray-700';
    }
    if (post.type === 'trade-log') {
      const tradeInfo = getTradeLogInfo(post.text);
      if (tradeInfo) {
        // 購入/売却に関わらず、銘柄の色で統一（購入のデザイン）
        if (tradeInfo.stock === 'A') {
          return 'bg-blue-500 text-white';
        }
        if (tradeInfo.stock === 'B') {
          return 'bg-red-500 text-white';
        }
      }
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-blue-100 text-blue-700';
  };

  // 投稿背景色を決定
  const getPostBgStyle = (post: typeof timelinePosts[0]) => {
    if (post.type === 'trade-log') {
      const tradeInfo = getTradeLogInfo(post.text);
      if (tradeInfo) {
        if (tradeInfo.stock === 'A') {
          return 'bg-blue-50 border-blue-200';
        }
        if (tradeInfo.stock === 'B') {
          return 'bg-red-50 border-red-200';
        }
      }
    }
    return 'bg-gray-50 border-gray-200';
  };

  // テキスト内の購入/売却を色分け（太字なし）
  const highlightTradeType = (text: string) => {
    if (text.includes('購入')) {
      return text.replace('購入', '<span class="text-green-600">購入</span>');
    }
    if (text.includes('売却')) {
      return text.replace('売却', '<span class="text-red-600">売却</span>');
    }
    return text;
  };


  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
        <h1 className="text-2xl font-bold mb-4 mt-2">タイムライン</h1>

        {/* 投稿フォーム */}
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="mb-3">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="呟きを入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {newPostText.length}/50
            </p>
          </div>
          <button
            type="submit"
            disabled={!newPostText.trim()}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              newPostText.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            投稿する
          </button>
        </form>

        {/* 投稿一覧 */}
        <div className="space-y-4">
          {timelinePosts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだ投稿がありません</p>
          ) : (
            timelinePosts.map((post) => (
              <div
                key={post.id}
                className={`border rounded-lg p-4 ${getPostBgStyle(post)}`}
              >
                <div className="flex items-center mb-2">
                  <span className={`text-xs px-2 py-1 rounded mr-2 font-medium ${getTagStyle(post)}`}>
                    {post.type === 'rumor' && '噂'}
                    {post.type === 'analysis' && '分析'}
                    {post.type === 'claim' && '宣言'}
                    {post.type === 'trade-log' && '取引ログ'}
                    {post.type === 'tweet' && '呟き'}
                    {post.type === 'system' && 'システム'}
                  </span>
                  {post.type !== 'system' && (
                    <span className="text-sm text-gray-500">{post.userName}</span>
                  )}
                </div>
                {post.type === 'trade-log' ? (
                  <p 
                    className="text-gray-800"
                    dangerouslySetInnerHTML={{ __html: highlightTradeType(post.text) }}
                  />
                ) : (
                  <p className="text-gray-800">{post.text}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <AuthGuard>
      <TimelineContent />
    </AuthGuard>
  );
}

