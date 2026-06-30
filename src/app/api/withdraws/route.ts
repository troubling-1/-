import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { WithdrawMethod } from "@/lib/types";

const withdrawMethods: WithdrawMethod[] = ["wechat", "alipay", "bank"];

function normalizeWithdraw(withdraw: Record<string, unknown>) {
  return {
    ...withdraw,
    amount: Number(withdraw.amount) || 0,
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

  const { data, error } = await supabase
    .from("withdraws")
    .select("*")
    .eq("user_id", authResult.data.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: ((data || []) as unknown as Array<Record<string, unknown>>).map(normalizeWithdraw) });
}

export async function POST(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const profile = authResult.data.profile;

  if (profile.role !== "escort") {
    return NextResponse.json({ error: "非护航师不能提现。" }, { status: 403 });
  }

  if (profile.status === "banned") {
    return NextResponse.json({ error: "账号已封禁，不能提现。" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const method = String(body.method || "").trim() as WithdrawMethod;
    const accountName = String(body.account_name || "").trim();
    const accountNo = String(body.account_no || "").trim();
    const note = String(body.note || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "提现金额必须大于 0。" }, { status: 400 });
    }

    if (!withdrawMethods.includes(method)) {
      return NextResponse.json({ error: "提现方式不正确。" }, { status: 400 });
    }

    if (accountName.length < 2 || accountName.length > 40) {
      return NextResponse.json({ error: "收款姓名需要填写 2 到 40 个字。" }, { status: 400 });
    }

    if (accountNo.length < 3 || accountNo.length > 80) {
      return NextResponse.json({ error: "收款账号需要填写 3 到 80 个字符。" }, { status: 400 });
    }

    const { data: escort, error: escortError } = await supabase
      .from("escorts")
      .select("id,status,approved")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .maybeSingle();

    if (escortError) {
      return NextResponse.json({ error: escortError.message }, { status: 500 });
    }

    if (!escort || !escort.approved) {
      return NextResponse.json({ error: "没有 active 护航师资料，不能提现。" }, { status: 403 });
    }

    const rpcClient = supabase as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await rpcClient.rpc("apply_withdraw", {
      target_user_id: profile.id,
      withdraw_amount: Number(amount.toFixed(2)),
      withdraw_method: method,
      withdraw_account_name: accountName,
      withdraw_account_no: accountNo,
      withdraw_note: note,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: normalizeWithdraw(data as Record<string, unknown>) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交提现申请失败。" }, { status: 500 });
  }
}
