import { NextResponse } from "next/server";
import { requireAdminProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { WithdrawStatus } from "@/lib/types";

const withdrawStatuses: WithdrawStatus[] = ["pending", "approved", "paid", "rejected", "cancelled"];

function normalizeWithdraw(withdraw: Record<string, unknown>) {
  return {
    ...withdraw,
    amount: Number(withdraw.amount) || 0,
  };
}

export async function GET(request: Request) {
  const authResult = await requireAdminProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  let query = supabase.from("withdraws").select("*, users:user_id(id,nickname,email)").order("created_at", { ascending: false });

  if (status !== "all") {
    if (!withdrawStatuses.includes(status as WithdrawStatus)) {
      return NextResponse.json({ error: "提现状态不正确。" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: ((data || []) as unknown as Array<Record<string, unknown>>).map(normalizeWithdraw) });
}

export async function POST(request: Request) {
  const authResult = await requireAdminProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const withdrawId = String(body.id || body.withdraw_id || "").trim();
    const action = String(body.action || "").trim();
    const adminNote = String(body.admin_note || "").trim();

    if (!withdrawId) {
      return NextResponse.json({ error: "提现编号不能为空。" }, { status: 400 });
    }

    if (!["approve", "paid", "reject"].includes(action)) {
      return NextResponse.json({ error: "提现审核操作不正确。" }, { status: 400 });
    }

    if (action === "reject" && adminNote.length < 2) {
      return NextResponse.json({ error: "拒绝提现必须填写原因。" }, { status: 400 });
    }

    const rpcClient = supabase as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await rpcClient.rpc("review_withdraw", {
      target_withdraw_id: withdrawId,
      review_action: action,
      note: adminNote,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: normalizeWithdraw(data as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "处理提现失败。" }, { status: 500 });
  }
}
