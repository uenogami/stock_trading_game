"use client";

import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />
      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">保険</h1>
        <p className="text-gray-600 mb-4">保険情報はこちらに表示されます。</p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          ← ホームに戻る
        </Link>
      </main>
    </div>
  );
}

