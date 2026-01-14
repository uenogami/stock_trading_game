"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TimeRemaining from "./TimeRemaining";

export default function TopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-sm px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto gap-2">
        <Link
          href="/rules"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            pathname === "/rules"
              ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg border border-blue-700/20"
              : "bg-gradient-to-b from-white to-gray-50 text-gray-700 hover:from-blue-50 hover:to-blue-100 hover:shadow-md border border-gray-300 shadow-sm"
          }`}
        >
          ルール
        </Link>
        <TimeRemaining />
        <Link
          href="/profile"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            pathname === "/profile"
              ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg border border-blue-700/20"
              : "bg-gradient-to-b from-white to-gray-50 text-gray-700 hover:from-blue-50 hover:to-blue-100 hover:shadow-md border border-gray-300 shadow-sm"
          }`}
        >
          プロフ
        </Link>
      </div>
    </nav>
  );
}

