import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { Review } from "@/lib/types";

const allowedTags = ["准时", "沟通好", "技术强", "撤离成功", "态度好"];

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter((item) => allowedTags.includes(item)).slice(0, 5);
}

function normalizeReview(review: Record<string, unknown>) {
  return {
    ...review,
    rating: Number(review.rating) || 0,
    tags: Array.isArray(review.tags) ? review.tags : [],
    hidden: Boolean(review.hidden),
  };
}

export async function GET(request: Request) {
  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "";
  const escortId = url.searchParams.get("escortId") || "";
  const orderId = url.searchParams.get("orderId") || "";

  if (scope === "admin" || orderId) {
    const authResult = await getAuthProfile(request);

    if (authResult.error || !authResult.data) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const profile = authResult.data.profile;

    if (scope === "admin") {
      if (profile.role !== "admin") {
        return NextResponse.json({ error: "无管理员权限。" }, { status: 403 });
      }

      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: (data || []).map((review) => normalizeReview(review)) });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,customer_id,user_id,escort_id,escorts(user_id)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "订单不存在。" }, { status: 404 });
    }

    const orderRecord = order as {
      customer_id?: string | null;
      user_id?: string | null;
      escorts?: { user_id?: string | null } | Array<{ user_id?: string | null }> | null;
    };
    const escortUserId = Array.isArray(orderRecord.escorts) ? orderRecord.escorts[0]?.user_id : orderRecord.escorts?.user_id;
    const canRead = profile.role === "admin" || orderRecord.customer_id === profile.id || orderRecord.user_id === profile.id || escortUserId === profile.id;

    if (!canRead) {
      return NextResponse.json({ error: "无权查看该订单评价。" }, { status: 403 });
    }

    const { data, error } = await supabase.from("reviews").select("*").eq("order_id", orderId).order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: (data || []).map((review) => normalizeReview(review)) });
  }

  let query = supabase.from("reviews").select("*").eq("hidden", false).order("created_at", { ascending: false });

  if (escortId) {
    query = query.eq("escort_id", escortId);
  }

  const { data, error } = await query.limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data || []).map((review) => normalizeReview(review)) });
}

export async function POST(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.order_id || "").trim();
    const rating = Number(body.rating);
    const content = String(body.content || "").trim();
    const tags = normalizeTags(body.tags);
    const profile = authResult.data.profile;

    if (!orderId) {
      return NextResponse.json({ error: "订单编号不能为空。" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "评分必须是 1 到 5 分。" }, { status: 400 });
    }

    if (content.length < 2 || content.length > 500) {
      return NextResponse.json({ error: "评价内容需要填写 2 到 500 个字。" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,customer_id,user_id,escort_id,status,escorts(user_id)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "订单不存在。" }, { status: 404 });
    }

    if (order.status !== "completed") {
      return NextResponse.json({ error: "只有已完成订单可以评价。" }, { status: 400 });
    }

    if (order.customer_id !== profile.id && order.user_id !== profile.id) {
      return NextResponse.json({ error: "只有该订单玩家可以评价。" }, { status: 403 });
    }

    const orderRecord = order as {
      id: string;
      customer_id?: string | null;
      user_id?: string | null;
      escort_id: string;
      status: string;
      escorts?: { user_id?: string | null } | Array<{ user_id?: string | null }> | null;
    };
    const escortUserId = Array.isArray(orderRecord.escorts) ? orderRecord.escorts[0]?.user_id : orderRecord.escorts?.user_id;

    if (escortUserId === profile.id) {
      return NextResponse.json({ error: "护航师不能评价自己的订单。" }, { status: 403 });
    }

    const { data: existingReview, error: existingError } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", orderId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existingReview) {
      return NextResponse.json({ error: "该订单已经评价过。" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        order_id: orderRecord.id,
        user_id: profile.id,
        escort_id: orderRecord.escort_id,
        rating,
        content,
        tags,
        hidden: false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.code === "23505" ? "该订单已经评价过。" : error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeReview(data) as Review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交评价失败。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.data.profile.role !== "admin") {
    return NextResponse.json({ error: "无管理员权限。" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const reviewId = String(body.id || "").trim();
    const hidden = Boolean(body.hidden);

    if (!reviewId) {
      return NextResponse.json({ error: "评价编号不能为空。" }, { status: 400 });
    }

    const { data, error } = await supabase.from("reviews").update({ hidden }).eq("id", reviewId).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeReview(data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新评价失败。" }, { status: 500 });
  }
}
