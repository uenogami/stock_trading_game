"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/useGameStore";
import { getLocalUserId } from "@/lib/localAuth";

export function useRealtimeSync() {
  useEffect(() => {
    const userId = getLocalUserId();
    if (!userId) {
      return;
    }

    const supabase = createClient();

    // チャンネル名をユニークにする（ユーザーIDとタイムスタンプを使用）
    const channelId = `stocks-${userId}-${Date.now()}`;

    // 株価の変更を監視
    const stocksChannel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stocks",
        },
        async (payload) => {
          const updatedStock = payload.new as any;
          const { stocks, updateStockFromRealtime } = useGameStore.getState();
          const existingStock = stocks.find((s) => s.symbol === updatedStock.symbol);
          
          // チャートデータを更新（取引履歴に基づく最新データを取得）
          let chartSeries = existingStock?.chartSeries || [];
          try {
            const stocksRes = await fetch('/api/stocks');
            if (stocksRes.ok) {
              const stocksData = await stocksRes.json();
              const latestStock = stocksData.stocks?.find((s: any) => s.symbol === updatedStock.symbol);
              if (latestStock?.chartSeries) {
                chartSeries = latestStock.chartSeries;
              }
            }
          } catch (error) {
            // エラー時は既存のチャートデータを保持
          }
          
          updateStockFromRealtime({
            symbol: updatedStock.symbol,
            name: updatedStock.name,
            price: updatedStock.price,
            change24h: updatedStock.change24h || 0,
            volume: updatedStock.volume || 0,
            chartSeries: chartSeries,
            coefficient: updatedStock.coefficient,
            maxHoldings: updatedStock.max_holdings,
            description: existingStock?.description || "",
          });
        }
      )
      .subscribe();

    // 取引の追加を監視は不要（stocksテーブルのUPDATEイベントで価格とチャートデータの両方が更新される）

    // タイムラインポストの追加を監視
    const timelineChannelId = `timeline-${userId}-${Date.now()}`;
    const timelineChannel = supabase
      .channel(timelineChannelId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "timeline_posts",
        },
        (payload) => {
          const newPost = payload.new as any;
          const { addTimelinePostFromRealtime } = useGameStore.getState();
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

    // ユーザー情報の更新を監視（現金アップイベントなど）
    const usersChannelId = `users-${userId}-${Date.now()}`;
    const usersChannel = supabase
      .channel(usersChannelId)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const updatedUser = payload.new as any;
          const { user: currentUser } = useGameStore.getState();
          // 既存のholdingsを保持しながら、更新された情報をマージ
          useGameStore.setState({
            user: {
              ...currentUser,
              cash: updatedUser.cash ?? currentUser.cash,
              holdings: updatedUser.holdings || currentUser.holdings || {},
              insuranceUsed: updatedUser.insurance_used ?? currentUser.insuranceUsed,
            },
          });
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(stocksChannel);
      supabase.removeChannel(timelineChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []); // 依存配列を空にして、一度だけ実行
}

