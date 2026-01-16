"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocalUserId, getLocalUsername } from "@/lib/localAuth";
import { useGameStore } from "@/store/useGameStore";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";
import { gameRules } from "@/config";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { setUserIdentity, loadInitialData, isLoading, setGameStartTime, updateElapsedTime, user } = useGameStore();

  // リアルタイム同期を開始（ログイン後のみ）
  useRealtimeSync();

  // ゲーム進行時間を監視し、イベントをトリガー
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggered40MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered40MinEvent') === 'true' : false
  );
  const isTriggering40MinEventRef = useRef<boolean>(false);
  const hasTriggeredGameEndRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggeredGameEnd') === 'true' : false
  );
  const isTriggeringGameEndRef = useRef<boolean>(false);
  const timersInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!ready || timersInitializedRef.current) return;
    timersInitializedRef.current = true;

    const timeState = {
      lastServerTimeUTC: null as number | null,
      lastClientTime: null as number | null,
    };

    const syncServerTime = async () => {
      try {
        const res = await fetch('/api/game-start-time');
        if (res.ok) {
          const data = await res.json();
          
          const currentGameStartTime = useGameStore.getState().gameStartTime;
          if (!currentGameStartTime || data.hasTrades) {
            setGameStartTime(new Date(data.gameStartTime));
            if (data.hasTrades) {
              if (hasTriggered40MinEventRef.current) {
                hasTriggered40MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered40MinEvent');
                }
              }
              if (hasTriggeredGameEndRef.current) {
                hasTriggeredGameEndRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggeredGameEnd');
                }
              }
            }
          }

          timeState.lastServerTimeUTC = new Date(data.serverNow).getTime();
          timeState.lastClientTime = Date.now();
        }
      } catch (error) {
        console.error('Failed to sync server time:', error);
      }
    };

    const startTimers = async () => {
      await syncServerTime();
      syncIntervalRef.current = setInterval(syncServerTime, 30000);

      const updateTimeAndCheckEvents = () => {
        const { gameStartTime: currentGameStartTime } = useGameStore.getState();
        if (!currentGameStartTime || timeState.lastServerTimeUTC === null || timeState.lastClientTime === null) {
          if (timeState.lastServerTimeUTC === null || timeState.lastClientTime === null) {
            syncServerTime();
          }
          return;
        }

        const clientNow = Date.now();
        const elapsedSinceLastSync = clientNow - timeState.lastClientTime;
        const serverNowUTC = timeState.lastServerTimeUTC + elapsedSinceLastSync;
        const gameStartUTC = currentGameStartTime.getTime();
        const elapsed = (serverNowUTC - gameStartUTC) / 1000;

        if (elapsed < 0) {
          updateElapsedTime(0, 0);
          return;
        }

        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        updateElapsedTime(minutes, seconds);

        // 40分経過時の現金1.2倍イベント
        const eventTimeMinutes = 40;
        if (elapsed >= eventTimeMinutes * 60 && !hasTriggered40MinEventRef.current && !isTriggering40MinEventRef.current) {
          isTriggering40MinEventRef.current = true;
          hasTriggered40MinEventRef.current = true;
          if (typeof window !== 'undefined') {
            localStorage.setItem('hasTriggered40MinEvent', 'true');
          }
          
          fetch('/api/events/cash-multiplier')
            .then((res) => res.ok ? res.json() : Promise.reject(new Error(`API error: ${res.status}`)))
            .then(async (data) => {
              if (data.success || data.usersUpdated > 0 || data.message === 'Event already applied') {
                const userId = user.id;
                if (userId) {
                  try {
                    const userRes = await fetch(`/api/users/${userId}`);
                    if (userRes.ok) {
                      const userData = await userRes.json();
                      useGameStore.setState({
                        user: { ...user, cash: userData.user.cash },
                      });
                    }
                  } catch (error) {
                    // エラーは無視（リアルタイム同期で反映される）
                  }
                }
              }
            })
            .catch((error) => {
              console.error('[Event] 40分イベントAPIエラー:', error);
            })
            .finally(() => {
              isTriggering40MinEventRef.current = false;
            });
        }

        // 60分経過時のゲーム終了処理
        const gameEndMinutes = 60;
        if (elapsed >= gameEndMinutes * 60 && !hasTriggeredGameEndRef.current && !isTriggeringGameEndRef.current) {
          isTriggeringGameEndRef.current = true;
          hasTriggeredGameEndRef.current = true;
          if (typeof window !== 'undefined') {
            localStorage.setItem('hasTriggeredGameEnd', 'true');
          }
          
          fetch('/api/events/game-end')
            .then((res) => res.ok ? res.json() : Promise.reject(new Error(`API error: ${res.status}`)))
            .then(async (data) => {
              if (data.success || data.message === 'Game end event already applied') {
                // ゲーム終了後、ユーザーデータを再取得
                const userId = user.id;
                if (userId) {
                  try {
                    const userRes = await fetch(`/api/users/${userId}`);
                    if (userRes.ok) {
                      const userData = await userRes.json();
                      useGameStore.setState({
                        user: { ...user, cash: userData.user.cash },
                      });
                    }
                  } catch (error) {
                    // エラーは無視（リアルタイム同期で反映される）
                  }
                }
                // 結果ページにリダイレクト（現在のパスが結果ページでない場合のみ）
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/results')) {
                  setTimeout(() => {
                    window.location.href = '/results';
                  }, 2000); // 2秒後にリダイレクト
                }
              }
            })
            .catch((error) => {
              console.error('[Event] ゲーム終了イベントAPIエラー:', error);
            })
            .finally(() => {
              isTriggeringGameEndRef.current = false;
            });
        }
      };

      updateIntervalRef.current = setInterval(updateTimeAndCheckEvents, 1000);
    };

    startTimers();

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const checkCardExpiry = () => {
      const { cards } = useGameStore.getState();
      const expiredCards = cards.filter(
        (c) => c.active && c.expiresAt && Date.now() >= c.expiresAt
      );

      if (expiredCards.length > 0) {
        const userId = getLocalUserId();
        if (userId) {
          expiredCards.forEach((card) => {
            fetch('/api/cards', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, cardId: card.id, action: 'expire' }),
            }).catch(() => {});
          });
          const updatedCards = cards.map((c) =>
            expiredCards.some((ec) => ec.id === c.id) ? { ...c, active: false } : c
          );
          useGameStore.setState({ cards: updatedCards });
        }
      }
    };

    const interval = setInterval(checkCardExpiry, 10000);
    return () => clearInterval(interval);
  }, [ready]);


  useEffect(() => {
    const init = async () => {
      const name = getLocalUsername();
      const userId = getLocalUserId();
      if (!name || !userId) {
        if (pathname !== "/login") router.replace("/login");
        return;
      }
      setUserIdentity(userId, name);
      await loadInitialData(userId);
      setReady(true);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


