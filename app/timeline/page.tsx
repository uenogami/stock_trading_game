"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import { mockTimelinePosts } from "@/fixtures/mockData";

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />
      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">タイムライン</h1>
        <div className="space-y-4">
          {mockTimelinePosts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center mb-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                  {post.type}
                </span>
                <span className="text-sm text-gray-500">{post.userName}</span>
              </div>
              <p className="text-gray-800">{post.text}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(post.createdAt).toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="block mt-6 text-center text-blue-600 hover:text-blue-800 underline"
        >
          ← ホームに戻る
        </Link>
      </main>
    </div>
  );
}

