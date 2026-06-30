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

export async function POST(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const profile = authResult.data.profile;

  if (profile.status === "banned") {
    return NextResponse.json({ error: "账号已封禁，不能充值。" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) {
      return NextResponse.json({ error: "充值金额必须大于 0，且不能超过 10000。" }, { status: 400 });
    }

    const rpcClient = supabase as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await rpcClient.rpc("recharge_wallet", {
      target_user_id: profile.id,
      recharge_amount: Number(amount.toFixed(2)),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeWallet(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "模拟充值失败。" }, { status: 500 });
  }
}
