"use client";

import Link from "next/link";
import { TimelinePost } from "@/fixtures/mockData";

interface NewsFeedProps {
  posts: TimelinePost[];
}

export default function NewsFeed({ posts }: NewsFeedProps) {
  const latestPost = posts.length > 0 ? posts[0] : null;

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-t-2 border-blue-200">
        {latestPost ? (
          <Link
            href="/timeline"
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-100 hover:shadow-md hover:border-blue-300 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {latestPost.type === 'rumor' && '噂'}
                  {latestPost.type === 'analysis' && '分析'}
                  {latestPost.type === 'claim' && '宣言'}
                  {latestPost.type === 'trade-log' && '取引ログ'}
                </span>
                <span className="text-[10px] text-gray-500">{latestPost.userName}</span>
              </div>
              <p className="text-xs text-gray-800 leading-tight font-medium group-hover:text-blue-700 transition-colors">
                {latestPost.text}
              </p>
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
            <p className="text-xs text-gray-500 text-center">まだ投稿がありません</p>
          </div>
        )}
        <Link
          href="/timeline"
          className="block mt-2 text-center text-[10px] text-blue-600 hover:text-blue-800 font-medium"
        >
          タイムラインを見る →
        </Link>
      </div>
    </div>
  );
}

