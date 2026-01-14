"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopNavigation from "@/components/TopNavigation";
import { getLocalUserId, getLocalUsername, setLocalUserId, setLocalUsername } from "@/lib/localAuth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = getLocalUsername();
    const existingId = getLocalUserId();
    if (existing && existingId) {
      router.replace("/");
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();
    
    if (!trimmed) {
      setError("ユーザー名を入力してください");
      return;
    }
    if (trimmed.length > 20) {
      setError("ユーザー名は20文字以内にしてください");
      return;
    }
    if (!trimmedPassword) {
      setError("パスワードを入力してください");
      return;
    }
    if (!/^\d{4}$/.test(trimmedPassword)) {
      setError("パスワードは4桁の数字で入力してください");
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError("パスワードが一致しません");
      return;
    }
    
    setError("");
    try {
      const res = await fetch("/api/local-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: trimmed,
          password: trimmedPassword,
          action: "signup",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "新規登録に失敗しました");
        return;
      }
      setLocalUsername(trimmed);
      setLocalUserId(json.userId);
      router.replace("/");
      router.refresh();
    } catch {
      setError("新規登録に失敗しました");
    }
  };

  return (
    <div className="h-screen bg-white relative">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <TopNavigation />
      </div>

      <main className="pt-20 max-w-md mx-auto w-full px-4 h-full overflow-hidden bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            新規登録
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            ユーザー名と4桁のパスワードを設定してください
          </p>

          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：うえの"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード（4桁の数字）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード（確認）
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                既にアカウントをお持ちの方はログイン
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-b from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg text-center font-semibold hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-blue-700/20"
            >
              新規登録
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

