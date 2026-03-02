"use client";

import { useEffect, useState, useRef, type MutableRefObject } from "react";
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
  const hasTriggered10MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered10MinEvent') === 'true' : false
  );
  const isTriggering10MinEventRef = useRef<boolean>(false);
  const hasTriggered20MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered20MinEvent') === 'true' : false
  );
  const isTriggering20MinEventRef = useRef<boolean>(false);
  const hasTriggered30MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered30MinEvent') === 'true' : false
  );
  const isTriggering30MinEventRef = useRef<boolean>(false);
  const hasTriggered40MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered40MinEvent') === 'true' : false
  );
  const isTriggering40MinEventRef = useRef<boolean>(false);
  const hasTriggered50MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered50MinEvent') === 'true' : false
  );
  const isTriggering50MinEventRef = useRef<boolean>(false);
  const hasTriggered55MinEventRef = useRef<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('hasTriggered55MinEvent') === 'true' : false
  );
  const isTriggering55MinEventRef = useRef<boolean>(false);
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
              if (hasTriggered10MinEventRef.current) {
                hasTriggered10MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered10MinEvent');
                }
              }
              if (hasTriggered20MinEventRef.current) {
                hasTriggered20MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered20MinEvent');
                }
              }
              if (hasTriggered30MinEventRef.current) {
                hasTriggered30MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered30MinEvent');
                }
              }
              if (hasTriggered40MinEventRef.current) {
                hasTriggered40MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered40MinEvent');
                }
              }
              if (hasTriggered50MinEventRef.current) {
                hasTriggered50MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered50MinEvent');
                }
              }
              if (hasTriggered55MinEventRef.current) {
                hasTriggered55MinEventRef.current = false;
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('hasTriggered55MinEvent');
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

        // イベントトリガー共通処理
        const triggerEvent = async (
          apiPath: string,
          eventKey: string,
          hasTriggeredRef: MutableRefObject<boolean>,
          isTriggeringRef: MutableRefObject<boolean>,
          onSuccess?: () => void
        ) => {
          if (hasTriggeredRef.current || isTriggeringRef.current) return;
          
          isTriggeringRef.current = true;
          hasTriggeredRef.current = true;
          if (typeof window !== 'undefined') {
            localStorage.setItem(eventKey, 'true');
          }
          
          try {
            const res = await fetch(apiPath);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            
            if (data.success || data.usersUpdated > 0 || data.message?.includes('already applied')) {
              // ユーザーデータを再取得（リアルタイム同期のフォールバック）
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
              onSuccess?.();
            }
          } catch (error) {
            console.error(`[Event] ${apiPath} エラー:`, error);
          } finally {
            isTriggeringRef.current = false;
          }
        };

        // 10分経過時：順位確認イベント
        if (elapsed >= 10 * 60) {
          triggerEvent(
            '/api/events/rank-check?time=10',
            'hasTriggered10MinEvent',
            hasTriggered10MinEventRef,
            isTriggering10MinEventRef
          );
        }

        // 20分経過時：順位差確認イベント
        if (elapsed >= 20 * 60) {
          triggerEvent(
            '/api/events/rank-check?time=20',
            'hasTriggered20MinEvent',
            hasTriggered20MinEventRef,
            isTriggering20MinEventRef
          );
        }

        // 30分経過時：全体順位確認イベント
        if (elapsed >= 30 * 60) {
          triggerEvent(
            '/api/events/rank-check?time=30',
            'hasTriggered30MinEvent',
            hasTriggered30MinEventRef,
            isTriggering30MinEventRef
          );
        }

        // 40分経過時の現金1.2倍イベント
        if (elapsed >= 40 * 60) {
          triggerEvent(
            '/api/events/cash-multiplier',
            'hasTriggered40MinEvent',
            hasTriggered40MinEventRef,
            isTriggering40MinEventRef
          );
        }

        // 50分経過時：順位・順位差確認イベント
        if (elapsed >= 50 * 60) {
          triggerEvent(
            '/api/events/rank-check?time=50',
            'hasTriggered50MinEvent',
            hasTriggered50MinEventRef,
            isTriggering50MinEventRef
          );
        }

        // 55分経過時（残り5分）のラストスパート通知
        if (elapsed >= 55 * 60) {
          triggerEvent(
            '/api/events/last-spurt',
            'hasTriggered55MinEvent',
            hasTriggered55MinEventRef,
            isTriggering55MinEventRef
          );
        }

        // 60分経過時のゲーム終了処理
        if (elapsed >= 60 * 60) {
          triggerEvent(
            '/api/events/game-end',
            'hasTriggeredGameEnd',
            hasTriggeredGameEndRef,
            isTriggeringGameEndRef,
            () => {
              // 結果ページにリダイレクト
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/results')) {
                setTimeout(() => {
                  window.location.href = '/results';
                }, 2000);
              }
            }
          );
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


