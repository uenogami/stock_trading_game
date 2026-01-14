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
      // ゲーム開始時刻を取得（ローカルストレージから）
      const startTime = localStorage.getItem('gameStartTime');
      
      // 開始時刻がない場合は、現在時刻を開始時刻として設定
      if (!startTime) {
        const now = new Date();
        localStorage.setItem('gameStartTime', now.toISOString());
        setTimeRemaining({ minutes: totalMinutes, seconds: 0 });
        return;
      }
      
      const gameStart = new Date(startTime);
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
    <div className="px-5 py-2 rounded-lg text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md text-center whitespace-nowrap">
      <span className="text-xs font-normal opacity-90">残り</span> {timeRemaining.minutes}分{timeRemaining.seconds}秒
    </div>
  );
}

