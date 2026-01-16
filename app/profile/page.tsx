"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNavigation from "@/components/TopNavigation";
import NewsFeed from "@/components/NewsFeed";
import { clearLocalUsername, getLocalUsername, getLocalUserId } from "@/lib/localAuth";
import { useGameStore } from "@/store/useGameStore";
import { gameRules } from "@/config";

interface EventData {
  userRank: number | null;
  totalUsers: number;
  upperRank: { rank: number; userName: string; totalAsset: number; difference: number } | null;
  lowerRank: { rank: number; userName: string; totalAsset: number; difference: number } | null;
  allRankings: Array<{ rank: number; userName: string; totalAsset: number }> | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, timelinePosts, calculateTotalAsset, cards, elapsedMinutes, gameStartTime } = useGameStore();
  const localUsername = getLocalUsername();
  const totalAsset = calculateTotalAsset();
  const [eventData, setEventData] = useState<{ [key: number]: EventData }>({});
  // カードの常時表示用のリアルタイムデータ
  const [realtimeRankData, setRealtimeRankData] = useState<EventData | null>(null);
  // 順位差表示カードの購入時刻とその時点の情報
  const [rankDifferenceCardData, setRankDifferenceCardData] = useState<{
    usedAt: { minutes: number; seconds: number };
    rankData: EventData;
  } | null>(null);

  // 順位常時可視化カードがアクティブかチェック
  const rankVisibilityCard = cards.find((c) => c.id === 'rank-visibility' && c.active);
  const shouldShowRank = rankVisibilityCard !== undefined;
  
  // 順位差表示カードが購入済みかチェック
  const rankDifferenceCard = cards.find((c) => c.id === 'rank-difference' && c.purchased);
  const rankDifferenceAlwaysCard = cards.find((c) => c.id === 'rank-difference-always' && c.active);

  // 順位差表示カードの購入時刻とその時点の情報を取得（localStorageから）
  useEffect(() => {
    const userId = getLocalUserId();
    if (!userId || !gameStartTime) return;

    // 既にデータが取得されている場合は更新しない
    if (rankDifferenceCardData) return;

    // localStorageから取得
    const cardDataKey = `rankDifferenceCardData_${userId}`;
    const savedCardDataStr = localStorage.getItem(cardDataKey);
    
    if (savedCardDataStr) {
      try {
        const savedCardData = JSON.parse(savedCardDataStr);
        // 使用時刻を再計算（ゲーム開始時刻が変わった場合に備えて）
        const cardUsedAt = new Date(savedCardData.usedAtTimestamp);
        const elapsed = (cardUsedAt.getTime() - gameStartTime.getTime()) / 1000;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        
        setRankDifferenceCardData({
          usedAt: { minutes, seconds },
          rankData: savedCardData.rankData,
        });
        return;
      } catch (error) {
        console.error('Failed to parse saved card data:', error);
      }
    }
    
    // 保存済みデータがない場合、カード情報を確認
    if (!rankDifferenceCard) {
      setRankDifferenceCardData(null);
      return;
    }
    
    // カードは購入されているが、データが保存されていない場合（新規購入時など）
    // 現在の情報を取得して保存
    const fetchRankDifferenceCardData = async () => {
      try {
        const cardsRes = await fetch(`/api/cards?userId=${userId}`);
        if (!cardsRes.ok) return;
        
        const cardsData = await cardsRes.json();
        const rankDifferenceCard = (cardsData.cards || []).find((c: any) => c.card_id === 'rank-difference' && c.purchased);
        
        if (!rankDifferenceCard) {
          setRankDifferenceCardData(null);
          return;
        }
        
        const rankingsRes = await fetch(`/api/rankings?userId=${userId}`);
        if (rankingsRes.ok) {
          const rankingsData = await rankingsRes.json();
          const fixedRankData: EventData = {
            userRank: rankingsData.userRank,
            totalUsers: rankingsData.totalUsers,
            upperRank: rankingsData.upperRank || null,
            lowerRank: rankingsData.lowerRank || null,
            allRankings: null,
          };
          
          const cardUsedAt = new Date(rankDifferenceCard.created_at);
          const elapsed = (cardUsedAt.getTime() - gameStartTime.getTime()) / 1000;
          const minutes = Math.floor(elapsed / 60);
          const seconds = Math.floor(elapsed % 60);
          
          const cardData = {
            usedAt: { minutes, seconds },
            usedAtTimestamp: cardUsedAt.toISOString(),
            rankData: fixedRankData,
          };
          
          // localStorageに保存
          localStorage.setItem(cardDataKey, JSON.stringify(cardData));
          
          setRankDifferenceCardData({
            usedAt: { minutes, seconds },
            rankData: fixedRankData,
          });
        }
      } catch (error) {
        console.error('Failed to fetch rank difference card data:', error);
      }
    };

    if (rankDifferenceCard) {
      fetchRankDifferenceCardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStartTime, rankDifferenceCard]);

  // 保存済みのイベント情報を取得（localStorageから）
  useEffect(() => {
    const userId = getLocalUserId();
    if (!userId) return;

    const savedEventsKey = `eventData_${userId}`;
    const savedEventsStr = localStorage.getItem(savedEventsKey);
    
    if (savedEventsStr) {
      try {
        const savedEvents = JSON.parse(savedEventsStr);
        setEventData(savedEvents);
      } catch (error) {
        console.error('Failed to parse saved event data:', error);
      }
    }
  }, []);

  // 各時点での情報を取得（一度だけ、更新しない）
  useEffect(() => {
    const fetchEventData = async (minute: number) => {
      const userId = getLocalUserId();
      if (!userId) return;

      // 既にstateにデータが存在する場合は取得しない
      if (eventData[minute]) {
        return;
      }

      try {
        const res = await fetch(`/api/rankings?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          const eventInfo: EventData = {
            userRank: data.userRank,
            totalUsers: data.totalUsers,
            upperRank: data.upperRank || null,
            lowerRank: data.lowerRank || null,
            allRankings: minute === 30 ? data.rankings?.map((r: any) => ({
              rank: r.rank,
              userName: r.userName,
              totalAsset: r.totalAsset,
            })) || null : null,
          };
          
          // 既にデータが存在しない場合のみ更新
          setEventData((prev) => {
            if (prev[minute]) {
              return prev; // 既にデータがある場合は更新しない
            }
            const newData = { ...prev, [minute]: eventInfo };
            
            // localStorageに保存
            const savedEventsKey = `eventData_${userId}`;
            localStorage.setItem(savedEventsKey, JSON.stringify(newData));
            
            return newData;
          });
        }
      } catch (error) {
        console.error(`Failed to fetch event data for ${minute}min:`, error);
      }
    };

    // 各イベント時点で情報を取得（一度だけ、更新しない）
    gameRules.events.forEach((event) => {
      if (event.time <= elapsedMinutes && !eventData[event.time]) {
        fetchEventData(event.time);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsedMinutes]);

  // 常時発動カードがアクティブな場合のリアルタイム更新（順位常時可視化カードと順位差常時表示カードのみ）
  useEffect(() => {
    if (!shouldShowRank && !rankDifferenceAlwaysCard) {
      return;
    }

    const fetchRealtimeData = async () => {
      const userId = getLocalUserId();
      if (!userId) return;

      try {
        const res = await fetch(`/api/rankings?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          const realtimeInfo: EventData = {
            userRank: data.userRank,
            totalUsers: data.totalUsers,
            upperRank: data.upperRank || null,
            lowerRank: data.lowerRank || null,
            allRankings: null,
          };
          setRealtimeRankData(realtimeInfo);
        }
      } catch (error) {
        console.error('Failed to fetch realtime rank data:', error);
      }
    };

    // 初回取得
    fetchRealtimeData();

    // 5秒ごとに更新
    const interval = setInterval(fetchRealtimeData, 5000);
    return () => clearInterval(interval);
  }, [shouldShowRank, rankDifferenceAlwaysCard]);

  const handleLogout = () => {
    clearLocalUsername();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-32">
        <h1 className="text-2xl font-bold mb-4 mt-2">プロフィール</h1>
        
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">ユーザー名</p>
            <p className="text-lg font-semibold text-gray-900">
              {localUsername || user.name || "未設定"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">総資産</p>
            <p className="text-lg font-semibold text-gray-900">
              {totalAsset}p
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">保険使用状況</p>
            <p className="text-lg font-semibold text-gray-900">
              {user.insuranceUsed ? "使用済み" : "未使用"}
            </p>
          </div>

          {/* 時点別情報表示 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">リアルタイムイベント情報</h2>
            <div className="space-y-3">
            {/* 順位差表示カードの使用情報（固定表示） */}
            {rankDifferenceCard && rankDifferenceCardData && (
              <div className="bg-white rounded-lg shadow-sm border border-purple-300 bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                    順位差表示カード使用
                  </span>
                  <span className="text-xs text-green-600 font-semibold">✓ 使用済み</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 mb-1">
                    使用時刻: {rankDifferenceCardData.usedAt.minutes}分{rankDifferenceCardData.usedAt.seconds}秒
                  </p>
                  {rankDifferenceCardData.rankData && (rankDifferenceCardData.rankData.upperRank || rankDifferenceCardData.rankData.lowerRank) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-semibold">順位差（使用時点）</p>
                      {rankDifferenceCardData.rankData.upperRank && (
                        <div className="mb-2 pb-2 border-b border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">上の順位との総資産差</p>
                          <p className="text-lg font-semibold text-red-600">
                            -{Math.abs(rankDifferenceCardData.rankData.upperRank.difference)}p
                          </p>
                        </div>
                      )}
                      {rankDifferenceCardData.rankData.lowerRank && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">下の順位との総資産差</p>
                          <p className="text-lg font-semibold text-green-600">
                            +{Math.abs(rankDifferenceCardData.rankData.lowerRank.difference)}p
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {gameRules.events
              .filter((event) => event.time !== 60) // ゲーム終了は除外
              .map((event) => {
                const data = eventData[event.time];
                const hasPassed = elapsedMinutes >= event.time;
                
                return (
                  <div
                    key={event.time}
                    className={`bg-white rounded-lg shadow-sm border p-4 ${
                      hasPassed && data
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {event.time}分時点
                      </span>
                      {hasPassed && data && (
                        <span className="text-xs text-green-600 font-semibold">✓ 確認済み</span>
                      )}
                    </div>
                    
                    {hasPassed && data ? (
                      <div className="space-y-2">
                        {/* 10分: 自分の順位確認 */}
                        {event.time === 10 && data.userRank !== null && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">自分の順位</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {data.userRank}位 / {data.totalUsers}人中
                            </p>
                          </div>
                        )}
                        
                        {/* 20分: 自分の上下順位との資産差確認 */}
                        {event.time === 20 && (data.upperRank || data.lowerRank) && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2 font-semibold">順位差</p>
                            {data.upperRank && (
                              <div className="mb-2 pb-2 border-b border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">上の順位との総資産差</p>
                                <p className="text-lg font-semibold text-red-600">
                                  -{Math.abs(data.upperRank.difference)}p
                                </p>
                              </div>
                            )}
                            {data.lowerRank && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">下の順位との総資産差</p>
                                <p className="text-lg font-semibold text-green-600">
                                  +{Math.abs(data.lowerRank.difference)}p
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* 30分: 全体の順位のみ確認（保有資産は非表示） */}
                        {event.time === 30 && data.allRankings && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2 font-semibold">全体順位</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {data.allRankings.map((ranking) => (
                                <div key={ranking.rank} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-700">
                                    {ranking.rank}位: {ranking.userName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 40分: 保有現金×1.2倍イベント */}
                        {event.time === 40 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">イベント発動</p>
                            <p className="text-lg font-semibold text-green-600">
                              保有現金×1.2倍
                            </p>
                          </div>
                        )}
                        
                        {/* 50分: 自分の順位と上下順位との資産差確認 */}
                        {event.time === 50 && (
                          <div className="space-y-3">
                            {data.userRank !== null && (
                              <div>
                                <p className="text-sm text-gray-600 mb-1">自分の順位</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {data.userRank}位 / {data.totalUsers}人中
                                </p>
                              </div>
                            )}
                            {(data.upperRank || data.lowerRank) && (
                              <div>
                                <p className="text-sm text-gray-600 mb-2 font-semibold">順位差</p>
                                {data.upperRank && (
                                  <div className="mb-2 pb-2 border-b border-gray-200">
                                    <p className="text-sm text-gray-600 mb-1">上の順位との総資産差</p>
                                    <p className="text-lg font-semibold text-red-600">
                                      -{Math.abs(data.upperRank.difference)}p
                                    </p>
                                  </div>
                                )}
                                {data.lowerRank && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">下の順位との総資産差</p>
                                    <p className="text-lg font-semibold text-green-600">
                                      +{Math.abs(data.lowerRank.difference)}p
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {event.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* カードがアクティブな場合の常時表示（リアルタイム更新） */}
          {shouldShowRank && realtimeRankData && realtimeRankData.userRank !== null && (
            <div className="bg-white rounded-lg shadow-sm border border-green-300 bg-green-50 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">順位（常時表示）</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {realtimeRankData.userRank}位 / {realtimeRankData.totalUsers}人中
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  常時表示中
                </span>
              </div>
            </div>
          )}
          
          {/* 順位差常時表示カードがアクティブな場合のみ常時表示 */}
          {rankDifferenceAlwaysCard && realtimeRankData && (realtimeRankData.upperRank || realtimeRankData.lowerRank) && (
            <div className="bg-white rounded-lg shadow-sm border border-green-300 bg-green-50 p-4">
              <p className="text-sm text-gray-600 mb-2 font-semibold">順位差（常時表示）</p>
              {realtimeRankData.upperRank && (
                <div className="mb-2 pb-2 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">上の順位との総資産差</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{Math.abs(realtimeRankData.upperRank.difference)}p
                  </p>
                </div>
              )}
              {realtimeRankData.lowerRank && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">下の順位との総資産差</p>
                  <p className="text-lg font-semibold text-green-600">
                    +{Math.abs(realtimeRankData.lowerRank.difference)}p
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-red-700/20"
          >
            ログアウト
          </button>
        </div>
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

