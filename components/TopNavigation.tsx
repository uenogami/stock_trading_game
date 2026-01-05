"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TimeRemaining from "./TimeRemaining";

export default function TopNavigation() {
  const pathname = usePathname();
  
  // シーズン終了日（例：7日後）
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(endDate.getHours() + 18);

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <Link
          href="/rules"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            pathname === "/rules"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          特別ルール
        </Link>
        <TimeRemaining endDate={endDate} />
        <Link
          href="/profile"
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            pathname === "/profile"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          プロフ
        </Link>
      </div>
    </nav>
  );
}

