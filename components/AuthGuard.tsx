"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocalUserId, getLocalUsername } from "@/lib/localAuth";
import { useGameStore } from "@/store/useGameStore";
import { useRealtimeSync } from "@/lib/hooks/useRealtimeSync";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const { setUserIdentity, loadInitialData, isLoading } = useGameStore();

  // リアルタイム同期を開始（ログイン後のみ）
  useRealtimeSync();

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
  }, [router, pathname, setUserIdentity, loadInitialData]);

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


