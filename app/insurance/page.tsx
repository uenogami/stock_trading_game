"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import { useGameStore } from "@/store/useGameStore";

export default function InsurancePage() {
  const { user, calculateTotalAsset, activateInsurance } = useGameStore();
  const totalAsset = calculateTotalAsset();
  const canActivate = totalAsset <= 1000 && !user.insuranceUsed;

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
        <h1 className="text-2xl font-bold mb-4 mt-2">保険</h1>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">発動条件</h2>
          <p className="text-sm text-gray-700 mb-2">
            総資産が <span className="font-bold text-red-600">1,000p以下</span> になった場合
          </p>
          <p className="text-sm text-gray-700 mb-2">
            1回のみ発動可能
          </p>
          <p className="text-sm text-gray-700">
            発動時：即時 <span className="font-bold text-green-600">2,000p</span> 付与
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">現在の総資産</span>
            <span className="text-2xl font-bold text-gray-900">{totalAsset}p</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">保険使用状況</span>
            <span className={`font-semibold ${user.insuranceUsed ? 'text-red-600' : 'text-green-600'}`}>
              {user.insuranceUsed ? '使用済み' : '未使用'}
            </span>
          </div>
        </div>

        <button
          onClick={activateInsurance}
          disabled={!canActivate}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            canActivate
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:scale-95 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {user.insuranceUsed
            ? "保険は既に使用済みです"
            : totalAsset > 1000
            ? `保険を発動するには総資産を${1000 - totalAsset}p減らす必要があります`
            : "2,000p付与（保険発動）"}
        </button>
      </main>
    </div>
  );
}

