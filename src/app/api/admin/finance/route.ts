import { NextResponse } from "next/server";
import { requireAdminProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function sumBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
}

function isToday(value: unknown) {
  if (typeof value !== "string") return false;
  return new Date(value).toLocaleDateString("zh-CN") === new Date().toLocaleDateString("zh-CN");
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

  const [walletsResult, ledgerResult, withdrawsResult, ordersResult] = await Promise.all([
    supabase.from("wallets").select("balance,total_income,pending_withdraw,total_withdrawn,role"),
    supabase.from("platform_ledger").select("amount,type,created_at"),
    supabase.from("withdraws").select("amount,status"),
    supabase.from("orders").select("price,platform_fee,escort_income,status,confirmed_at,created_at"),
  ]);

  if (walletsResult.error) {
    return NextResponse.json({ error: walletsResult.error.message }, { status: 500 });
  }
  if (ledgerResult.error) {
    return NextResponse.json({ error: ledgerResult.error.message }, { status: 500 });
  }
  if (withdrawsResult.error) {
    return NextResponse.json({ error: withdrawsResult.error.message }, { status: 500 });
  }
  if (ordersResult.error) {
    return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
  }

  const wallets = (walletsResult.data || []) as Array<Record<string, unknown>>;
  const ledger = (ledgerResult.data || []) as Array<Record<string, unknown>>;
  const withdraws = (withdrawsResult.data || []) as Array<Record<string, unknown>>;
  const orders = (ordersResult.data || []) as Array<Record<string, unknown>>;
  const completedOrders = orders.filter((order) => order.status === "completed");
  const todayCompletedOrders = completedOrders.filter((order) => isToday(order.confirmed_at || order.created_at));
  const platformFeeRows = ledger.filter((item) => item.type === "platform_fee");

  return NextResponse.json({
    data: {
      user_total_balance: sumBy(wallets, "balance"),
      escort_total_income: sumBy(wallets, "total_income"),
      platform_total_fee: sumBy(platformFeeRows, "amount"),
      pending_withdraw_amount: sumBy(withdraws.filter((item) => item.status === "pending" || item.status === "approved"), "amount"),
      paid_withdraw_amount: sumBy(withdraws.filter((item) => item.status === "paid"), "amount"),
      today_deal_amount: sumBy(todayCompletedOrders, "price"),
      today_platform_fee: sumBy(todayCompletedOrders, "platform_fee"),
      today_escort_income: sumBy(todayCompletedOrders, "escort_income"),
    },
  });
}
