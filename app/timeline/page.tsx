"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import { useGameStore } from "@/store/useGameStore";
import { useState } from "react";

export default function TimelinePage() {
  const { timelinePosts, addTimelinePost, user } = useGameStore();
  const [newPostText, setNewPostText] = useState("");
  const [postType, setPostType] = useState<'rumor' | 'analysis' | 'claim' | 'trade-log'>('rumor');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    await addTimelinePost({
      userId: user.id,
      userName: user.name,
      type: postType,
      text: newPostText,
    });

    setNewPostText("");
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              投稿タイプ
            </label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rumor">噂</option>
              <option value="analysis">分析</option>
              <option value="claim">宣言</option>
              <option value="trade-log">取引ログ</option>
            </select>
          </div>
          <div className="mb-3">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="投稿内容を入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
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
                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center mb-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                    {post.type === 'rumor' && '噂'}
                    {post.type === 'analysis' && '分析'}
                    {post.type === 'claim' && '宣言'}
                    {post.type === 'trade-log' && '取引ログ'}
                  </span>
                  <span className="text-sm text-gray-500">{post.userName}</span>
                </div>
                <p className="text-gray-800">{post.text}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.createdAt).toLocaleString("ja-JP")}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

