import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getAuthProfile } from "@/lib/supabase/auth";
import type { OrderStatus, ServiceType } from "@/lib/types";

const serviceTypes: ServiceType[] = ["escort", "evacuation", "materials", "rank", "fun"];
const orderStatuses: OrderStatus[] = ["pending", "accepted", "in_progress", "completed", "cancelled"];

function normalizeOrder(order: Record<string, unknown>) {
  return {
    ...order,
    price: Number(order.price) || 0,
    requirement: order.requirement || order.remark || "",
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
  const scope = url.searchParams.get("scope") || "mine";
  const status = url.searchParams.get("status") || "";
  const profile = authResult.data.profile;

  let query = supabase
    .from("orders")
    .select(
      "*, escorts(id,user_id,nickname,price), customer:customer_id(id,nickname,email)",
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    if (!orderStatuses.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "订单状态不正确。" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  if (scope === "admin") {
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "无管理员权限。" }, { status: 403 });
    }
  } else if (scope === "escort") {
    if (profile.role !== "escort" && profile.role !== "admin") {
      return NextResponse.json({ error: "无护航师权限。" }, { status: 403 });
    }

    if (profile.role !== "admin") {
      const { data: escortProfile, error: escortError } = await supabase.from("escorts").select("id").eq("user_id", profile.id).maybeSingle();

      if (escortError) {
        return NextResponse.json({ error: escortError.message }, { status: 500 });
      }

      if (!escortProfile) {
        return NextResponse.json({ data: [] });
      }

      query = query.eq("escort_id", escortProfile.id);
    }
  } else {
    query = query.eq("customer_id", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data || []).map((order) => normalizeOrder(order)) });
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
    const escortId = String(body.escort_id || "").trim();
    const serviceType = String(body.service_type || "").trim() as ServiceType;
    const gameMode = String(body.game_mode || "").trim();
    const requirement = String(body.requirement || "").trim();
    const contactWechat = String(body.contact_wechat || "").trim();
    const contactQq = String(body.contact_qq || "").trim();

    if (!escortId) {
      return NextResponse.json({ error: "护航师不能为空。" }, { status: 400 });
    }

    if (!serviceTypes.includes(serviceType)) {
      return NextResponse.json({ error: "服务类型不正确。" }, { status: 400 });
    }

    if (!gameMode || gameMode.length > 50) {
      return NextResponse.json({ error: "游戏模式不能为空，且不能超过 50 个字。" }, { status: 400 });
    }

    if (requirement.length < 5 || requirement.length > 500) {
      return NextResponse.json({ error: "需求说明需要填写 5 到 500 个字。" }, { status: 400 });
    }

    if (!contactWechat && !contactQq) {
      return NextResponse.json({ error: "微信或 QQ 至少填写一个。" }, { status: 400 });
    }

    const { data: escort, error: escortError } = await supabase.from("escorts").select("id,price,approved").eq("id", escortId).maybeSingle();

    if (escortError) {
      return NextResponse.json({ error: escortError.message }, { status: 500 });
    }

    if (!escort || !escort.approved) {
      return NextResponse.json({ error: "护航师不存在或暂不可接单。" }, { status: 404 });
    }

    const price = Number(escort.price) || 0;

    if (price <= 0) {
      return NextResponse.json({ error: "护航师价格配置不正确。" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_id: authResult.data.profile.id,
        user_id: authResult.data.profile.id,
        escort_id: escortId,
        service_type: serviceType,
        game_mode: gameMode,
        requirement,
        remark: requirement,
        price,
        contact_wechat: contactWechat || null,
        contact_qq: contactQq || null,
        status: "pending",
      })
      .select("*, escorts(id,user_id,nickname,price), customer:customer_id(id,nickname,email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeOrder(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建订单失败。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const orderId = String(body.id || "").trim();
    const status = String(body.status || "").trim() as OrderStatus;
    const profile = authResult.data.profile;

    if (!orderId) {
      return NextResponse.json({ error: "订单编号不能为空。" }, { status: 400 });
    }

    if (!orderStatuses.includes(status)) {
      return NextResponse.json({ error: "订单状态不正确。" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, escorts(id,user_id,nickname,price)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "订单不存在。" }, { status: 404 });
    }

    const isCustomer = order.customer_id === profile.id || order.user_id === profile.id;
    const isEscort = order.escorts?.user_id === profile.id;
    const isAdmin = profile.role === "admin";
    const now = new Date().toISOString();
    const updatePayload: Record<string, string | null> = { status };

    if (status === "cancelled") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "无权取消该订单。" }, { status: 403 });
      }
      if (order.status === "completed") {
        return NextResponse.json({ error: "已完成订单不能取消。" }, { status: 400 });
      }
      updatePayload.cancelled_at = now;
    } else {
      if (!isEscort && !isAdmin) {
        return NextResponse.json({ error: "无权修改该订单状态。" }, { status: 403 });
      }

      const allowedNextStatus: Record<OrderStatus, OrderStatus | null> = {
        pending: "accepted",
        accepted: "in_progress",
        in_progress: "completed",
        completed: null,
        cancelled: null,
      };

      if (!isAdmin && allowedNextStatus[order.status as OrderStatus] !== status) {
        return NextResponse.json({ error: "订单状态流转不正确。" }, { status: 400 });
      }

      if (status === "accepted") {
        updatePayload.accepted_at = now;
      }

      if (status === "completed") {
        updatePayload.completed_at = now;
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select("*, escorts(id,user_id,nickname,price), customer:customer_id(id,nickname,email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeOrder(data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新订单状态失败。" }, { status: 500 });
  }
}
