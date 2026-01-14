"use client";

import { useState, useEffect } from "react";
import { gameRules } from "@/config";

export default function TimeRemaining() {
  const [timeRemaining, setTimeRemaining] = useState({
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // デモプレイ版：90分のゲーム時間
    const totalMinutes = gameRules.playTime;
    
    const updateTime = () => {
      // ゲーム開始時刻を取得（ローカルストレージから、または固定値）
      // 簡易版：現在時刻から90分前を開始時刻とする
      const startTime = localStorage.getItem('gameStartTime');
      const gameStart = startTime ? new Date(startTime) : new Date(Date.now() - (totalMinutes - 90) * 60 * 1000);
      
      if (!startTime) {
        localStorage.setItem('gameStartTime', gameStart.toISOString());
      }

      const now = new Date();
      const elapsed = (now.getTime() - gameStart.getTime()) / 1000; // 経過時間（秒）
      const remaining = totalMinutes * 60 - elapsed; // 残り時間（秒）

      if (remaining <= 0) {
        setTimeRemaining({ minutes: 0, seconds: 0 });
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);

      setTimeRemaining({ minutes, seconds });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // 1秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md min-w-[120px] text-center">
      <span className="text-xs font-normal opacity-90">残り</span> {timeRemaining.minutes}分{timeRemaining.seconds}秒
    </div>
  );
}

