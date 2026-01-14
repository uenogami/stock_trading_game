"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import { Stock, TimelinePost } from "@/fixtures/mockData";
import { getLocalUserId } from "@/lib/localAuth";

export function useRealtimeSync() {
  const updateStockFromRealtime = useGameStore((state) => state.updateStockFromRealtime);
  const addTimelinePostFromRealtime = useGameStore((state) => state.addTimelinePostFromRealtime);

  useEffect(() => {
    // ログインしていない場合は何もしない
    const userId = getLocalUserId();
    if (!userId) {
      return;
    }

    const supabase = createClient();

    // 株価の変更を監視
    const stocksChannel = supabase
      .channel("stocks-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stocks",
        },
        (payload) => {
          const updatedStock = payload.new as any;
          // ストアの株価を更新
          updateStockFromRealtime({
            symbol: updatedStock.symbol,
            name: updatedStock.name,
            price: updatedStock.price,
            change24h: updatedStock.change24h || 0,
            volume: updatedStock.volume || 0,
            chartSeries: [], // チャートデータは別途取得が必要
            coefficient: updatedStock.coefficient,
            maxHoldings: updatedStock.max_holdings,
            description: "", // 説明文は別途取得が必要
          });
        }
      )
      .subscribe();

    // タイムラインポストの追加を監視
    const timelineChannel = supabase
      .channel("timeline-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_posts",
        },
        (payload) => {
          const newPost = payload.new as any;
          // ストアにタイムラインポストを追加
          addTimelinePostFromRealtime({
            id: newPost.id,
            userId: newPost.user_id,
            userName: newPost.user_name,
            type: newPost.type,
            text: newPost.text,
            createdAt: newPost.created_at,
          });
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(stocksChannel);
      supabase.removeChannel(timelineChannel);
    };
  }, [updateStockFromRealtime, addTimelinePostFromRealtime]);
}

