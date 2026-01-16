"use client";

import { useEffect, useState } from "react";
import TopNavigation from "@/components/TopNavigation";
import AuthGuard from "@/components/AuthGuard";
import { getLocalUserId } from "@/lib/localAuth";
import Link from "next/link";

interface Ranking {
  rank: number;
  userId: string;
  userName: string;
  totalAsset: number;
  cash: number;
  holdingsValue: number;
}

export default function ResultsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await fetch('/api/rankings');
        if (res.ok) {
          const data = await res.json();
          setRankings(data.rankings || []);
        }
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <TopNavigation />
        </div>
        <main className="pt-20 max-w-md mx-auto px-4 py-6 pb-32">
          <h1 className="text-2xl font-bold mb-4 mt-2">最終結果</h1>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">結果を読み込み中...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">結果がありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((ranking, index) => (
                <div
                  key={ranking.userId}
                  className={`bg-white rounded-lg shadow-sm border p-4 ${
                    index === 0
                      ? "border-yellow-400 bg-yellow-50"
                      : index === 1
                      ? "border-gray-300 bg-gray-50"
                      : index === 2
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0
                            ? "bg-yellow-400 text-yellow-900"
                            : index === 1
                            ? "bg-gray-300 text-gray-700"
                            : index === 2
                            ? "bg-orange-300 text-orange-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {ranking.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{ranking.userName}</p>
                        <p className="text-sm text-gray-600">
                          現金: {ranking.cash.toLocaleString()}p / 保有株: {ranking.holdingsValue.toLocaleString()}p
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {ranking.totalAsset.toLocaleString()}p
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-block bg-gradient-to-b from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-blue-700/20"
            >
              ホームに戻る
            </Link>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

