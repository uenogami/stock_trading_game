"use client";

import Link from "next/link";
import { TimelinePost } from "@/fixtures/mockData";

interface NewsFeedProps {
  posts: TimelinePost[];
}

export default function NewsFeed({ posts }: NewsFeedProps) {
  const latestPost = posts.length > 0 ? posts[0] : null;

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
  const getTagStyle = (post: TimelinePost) => {
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
  const getPostBgStyle = (post: TimelinePost) => {
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
    return 'bg-white border-blue-100';
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
    <div className="w-full">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-t-2 border-blue-200">
        {latestPost ? (
            <Link
              href="/timeline"
            className="block group"
          >
            <div className={`rounded-lg shadow-sm p-3 border hover:shadow-md transition-all ${getPostBgStyle(latestPost)}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTagStyle(latestPost)}`}>
                  {latestPost.type === 'rumor' && '噂'}
                  {latestPost.type === 'analysis' && '分析'}
                  {latestPost.type === 'claim' && '宣言'}
                  {latestPost.type === 'trade-log' && '取引ログ'}
                  {latestPost.type === 'tweet' && '呟き'}
                  {latestPost.type === 'system' && 'システム'}
                </span>
                {latestPost.type !== 'system' && (
                  <span className="text-[10px] text-gray-500">{latestPost.userName}</span>
                )}
              </div>
              {latestPost.type === 'trade-log' ? (
                <p 
                  className="text-xs text-gray-800 leading-tight font-medium group-hover:text-blue-700 transition-colors"
                  dangerouslySetInnerHTML={{ __html: highlightTradeType(latestPost.text) }}
                />
              ) : (
                <p className="text-xs text-gray-800 leading-tight font-medium group-hover:text-blue-700 transition-colors">
                  {latestPost.text}
                </p>
              )}
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

