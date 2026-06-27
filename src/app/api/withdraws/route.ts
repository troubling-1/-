import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const escortId = String(body.escort_id || "").trim();
    const amount = Number(body.amount);

    if (!escortId) {
      return NextResponse.json({ error: "护航师编号不能为空" }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "提现金额必须大于 0" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ data: { id: `mock-${Date.now()}`, escort_id: escortId, amount, status: "pending" }, source: "mock" });
    }

    const { data, error } = await supabase
      .from("withdraws")
      .insert({ escort_id: escortId, amount, status: "pending" })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, source: "supabase" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交提现失败" }, { status: 500 });
  }
}
