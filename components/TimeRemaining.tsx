"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/store/useGameStore";

export default function TimeRemaining() {
  const { elapsedMinutes, elapsedSeconds } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ハイドレーションエラーを防ぐため、クライアント側でのみ実際の値を表示
  if (!mounted) {
    return (
      <div className="px-5 py-2 rounded-lg text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md text-center whitespace-nowrap">
        <span className="text-xs font-normal opacity-90">経過</span> 0分0秒
      </div>
    );
  }

  return (
    <div className="px-5 py-2 rounded-lg text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md text-center whitespace-nowrap">
      <span className="text-xs font-normal opacity-90">経過</span> {elapsedMinutes}分{elapsedSeconds}秒
    </div>
  );
}

