"use client";

import TopNavigation from "@/components/TopNavigation";
import NewsFeed from "@/components/NewsFeed";
import AuthGuard from "@/components/AuthGuard";
import { useGameStore } from "@/store/useGameStore";
import { gameRules } from "@/config";

function InsuranceContent() {
  const { user, timelinePosts, calculateTotalAsset, activateInsurance } = useGameStore();
  const totalAsset = calculateTotalAsset();
  const canActivate = totalAsset <= gameRules.insurance.threshold && !user.insuranceUsed;

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>
      <main className="pt-20 max-w-md mx-auto px-4 py-6 overflow-y-auto pb-32">
        <h1 className="text-2xl font-bold mb-4 mt-2">保険</h1>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">発動条件</h2>
          <p className="text-sm text-gray-700 mb-2">
            総資産が <span className="font-bold text-red-600">{gameRules.insurance.threshold}p以下</span> になった場合
          </p>
          <p className="text-sm text-gray-700 mb-2">
            1回のみ発動可能
          </p>
          <p className="text-sm text-gray-700">
            発動時：即時 <span className="font-bold text-green-600">{gameRules.insurance.amount}p</span> 付与
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
          onClick={async () => {
            if (canActivate) {
              const confirmMessage = `保険を発動して${gameRules.insurance.amount}pを受け取りますか？\n（1回のみ使用可能）`;
              if (window.confirm(confirmMessage)) {
                await activateInsurance();
              }
            }
          }}
          disabled={!canActivate}
          className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
            canActivate
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:scale-95 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {user.insuranceUsed
            ? "保険は既に使用済みです"
            : totalAsset > gameRules.insurance.threshold
            ? `総資産${gameRules.insurance.threshold}p以下で使用可能`
            : `${gameRules.insurance.amount}p付与（保険発動）`}
        </button>
      </main>

      {/* タイムライン（画面bottomに固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
        <div className="max-w-md mx-auto w-full">
          <NewsFeed posts={timelinePosts} />
        </div>
      </div>
    </div>
  );
}

export default function InsurancePage() {
  return (
    <AuthGuard>
      <InsuranceContent />
    </AuthGuard>
  );
}

