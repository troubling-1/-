import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function normalizeOrder(order: Record<string, unknown>) {
  return {
    ...order,
    price: Number(order.price) || 0,
    platform_fee: Number(order.platform_fee) || 0,
    escort_income: Number(order.escort_income) || 0,
  };
}

export async function POST(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const profile = authResult.data.profile;

  if (profile.status === "banned") {
    return NextResponse.json({ error: "账号已封禁，不能支付订单。" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.order_id || body.id || "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "订单编号不能为空。" }, { status: 400 });
    }

    const rpcClient = supabase as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await rpcClient.rpc("pay_order_with_wallet", {
      target_order_id: orderId,
      payer_user_id: profile.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: normalizeOrder(data as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "余额支付失败。" }, { status: 500 });
  }
}
