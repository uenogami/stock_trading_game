import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gameRules } from "@/config";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const username = String(body?.username ?? "").trim();

    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 });
    }

    if (username.length > 20) {
      return NextResponse.json({ error: "username too long" }, { status: 400 });
    }

    // 既存ユーザー検索（簡易：name一致）
    const { data: existing, error: selectError } = await supabase
      .from("users")
      .select("id,name,cash,holdings,insurance_used")
      .eq("name", username)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json({
        userId: existing.id,
        name: existing.name,
      });
    }

    // 新規作成（DB側でUUIDが発行される）
    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({
        name: username,
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
  } catch (error) {
    console.error("local-auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


