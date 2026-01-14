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
          
          // ストアから既存の株価データを取得（チャートデータと説明文を保持するため）
          const currentStocks = useGameStore.getState().stocks;
          const existingStock = currentStocks.find((s) => s.symbol === updatedStock.symbol);
          
          // ストアの株価を更新（既存のチャートデータと説明文を保持）
          updateStockFromRealtime({
            symbol: updatedStock.symbol,
            name: updatedStock.name,
            price: updatedStock.price,
            change24h: updatedStock.change24h || 0,
            volume: updatedStock.volume || 0,
            chartSeries: existingStock?.chartSeries || [], // 既存のチャートデータを保持
            coefficient: updatedStock.coefficient,
            maxHoldings: updatedStock.max_holdings,
            description: existingStock?.description || "", // 既存の説明文を保持
          });
        }
      )
      .subscribe();

    // 取引の追加を監視（チャートデータ更新用）
    const tradesChannel = supabase
      .channel("trades-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trades",
        },
        async (payload) => {
          const newTrade = payload.new as any;
          // 取引が発生した時、該当銘柄のチャートデータを更新
          const currentStocks = useGameStore.getState().stocks;
          const updatedStock = currentStocks.find((s) => s.symbol === newTrade.symbol);
          
          if (updatedStock) {
            // 最新のチャートデータを取得
            try {
              const stocksRes = await fetch('/api/stocks');
              if (stocksRes.ok) {
                const stocksData = await stocksRes.json();
                const latestStock = stocksData.stocks?.find((s: Stock) => s.symbol === newTrade.symbol);
                
                if (latestStock) {
                  // チャートデータを含めて更新
                  updateStockFromRealtime({
                    ...updatedStock,
                    price: latestStock.price,
                    volume: latestStock.volume,
                    chartSeries: latestStock.chartSeries,
                  });
                }
              }
            } catch (error) {
              console.error('Failed to update chart data:', error);
            }
          }
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
      supabase.removeChannel(tradesChannel);
      supabase.removeChannel(timelineChannel);
    };
  }, [updateStockFromRealtime, addTimelinePostFromRealtime]);
}

