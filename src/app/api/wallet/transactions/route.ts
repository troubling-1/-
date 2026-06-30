import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function normalizeTransaction(transaction: Record<string, unknown>) {
  return {
    ...transaction,
    amount: Number(transaction.amount) || 0,
    balance_before: Number(transaction.balance_before) || 0,
    balance_after: Number(transaction.balance_after) || 0,
  };
}

export async function GET(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 30, 100);
  let query = supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", authResult.data.profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: ((data || []) as unknown as Array<Record<string, unknown>>).map(normalizeTransaction) });
}
