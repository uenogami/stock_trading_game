"use client";

import Link from "next/link";
import { TimelinePost } from "@/fixtures/mockData";

interface NewsFeedProps {
  posts: TimelinePost[];
}

export default function NewsFeed({ posts }: NewsFeedProps) {
  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">ニュース・イベント</h3>
        <div className="space-y-2">
          {posts.slice(0, 10).map((post) => (
            <Link
              key={post.id}
              href="/timeline"
              className="block p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm text-gray-700">{post.text}</p>
            </Link>
          ))}
        </div>
        <Link
          href="/timeline"
          className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          タイムラインを見る →
        </Link>
      </div>
    </div>
  );
}

