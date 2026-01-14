"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TimeRemaining from "./TimeRemaining";

export default function TopNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-sm px-2 py-3">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <Link
          href="/"
          className={`px-3 py-2 rounded-lg transition-all active:scale-95 flex-shrink-0 flex items-center justify-center ${
            pathname === "/"
              ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg border border-blue-700/20"
              : "bg-gradient-to-b from-white to-gray-50 text-gray-700 hover:from-blue-50 hover:to-blue-100 hover:shadow-md border border-gray-300 shadow-sm"
          }`}
          title="ホーム"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Link>
        <div className="flex-1 flex justify-center">
          <TimeRemaining />
        </div>
        <Link
          href="/rules"
          className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-95 flex-shrink-0 ${
            pathname === "/rules"
              ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg border border-blue-700/20"
              : "bg-gradient-to-b from-white to-gray-50 text-gray-700 hover:from-blue-50 hover:to-blue-100 hover:shadow-md border border-gray-300 shadow-sm"
          }`}
        >
          ルール
        </Link>
        <Link
          href="/profile"
          className={`px-3 py-2 rounded-lg transition-all active:scale-95 flex-shrink-0 flex items-center justify-center ${
            pathname === "/profile"
              ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg border border-blue-700/20"
              : "bg-gradient-to-b from-white to-gray-50 text-gray-700 hover:from-blue-50 hover:to-blue-100 hover:shadow-md border border-gray-300 shadow-sm"
          }`}
          title="プロフィール"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </div>
    </nav>
  );
}

