import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function normalizeWallet(wallet: Record<string, unknown>) {
  return {
    ...wallet,
    balance: Number(wallet.balance) || 0,
    frozen_balance: Number(wallet.frozen_balance) || 0,
    total_recharge: Number(wallet.total_recharge) || 0,
    total_spent: Number(wallet.total_spent) || 0,
    total_income: Number(wallet.total_income) || 0,
    total_withdrawn: Number(wallet.total_withdrawn) || 0,
    pending_withdraw: Number(wallet.pending_withdraw) || 0,
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

  const profile = authResult.data.profile;
  const walletRole = profile.role === "escort" ? "escort" : profile.role === "admin" ? "admin" : "customer";
  const rpcClient = supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  const { error: ensureError } = await rpcClient.rpc("ensure_wallet", {
    target_user_id: profile.id,
    wallet_role: walletRole,
  });

  if (ensureError) {
    return NextResponse.json({ error: ensureError.message }, { status: 500 });
  }

  const { data, error } = await supabase.from("wallets").select("*").eq("user_id", profile.id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ? normalizeWallet(data as Record<string, unknown>) : null });
}
