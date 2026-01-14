"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import { clearLocalUsername, getLocalUsername } from "@/lib/localAuth";
import { useGameStore } from "@/store/useGameStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, stocks, calculateTotalAsset } = useGameStore();
  const localUsername = getLocalUsername();
  const totalAsset = calculateTotalAsset();

  const handleLogout = () => {
    clearLocalUsername();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-20">
        <h1 className="text-2xl font-bold mb-4 mt-2">プロフィール</h1>
        
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">ユーザー名</p>
            <p className="text-lg font-semibold text-gray-900">
              {localUsername || user.name || "未設定"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">総資産</p>
            <p className="text-lg font-semibold text-gray-900">
              {totalAsset}p
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">保険使用状況</p>
            <p className="text-lg font-semibold text-gray-900">
              {user.insuranceUsed ? "使用済み" : "未使用"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-red-700/20"
          >
            ログアウト
          </button>
        </div>
      </main>
    </div>
  );
}

