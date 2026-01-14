import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gameRules } from "@/config";
import { createHash } from "crypto";

// パスワードをハッシュ化（SHA256）
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();

    if (!username) {
      return NextResponse.json({ error: "ユーザー名を入力してください" }, { status: 400 });
    }

    if (username.length > 20) {
      return NextResponse.json({ error: "ユーザー名は20文字以内にしてください" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "パスワードを入力してください" }, { status: 400 });
    }

    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json({ error: "パスワードは4桁の数字で入力してください" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // 既存ユーザー検索
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("id,name,password_hash,cash,holdings,insurance_used")
      .eq("name", username)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing?.id) {
      // 既存ユーザー：パスワード検証
      if (!existing.password_hash || existing.password_hash !== passwordHash) {
        return NextResponse.json({ error: "ユーザー名またはパスワードが正しくありません" }, { status: 401 });
      }
      return NextResponse.json({
        userId: existing.id,
        name: existing.name,
      });
    } else {
      // 新規ユーザー：自動で作成
      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert({
          name: username,
          password_hash: passwordHash,
          cash: gameRules.initialCash,
          holdings: gameRules.initialHoldings,
          insurance_used: false,
        })
        .select("id,name")
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ userId: created.id, name: created.name });
    }
  } catch (error) {
    console.error("local-auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


