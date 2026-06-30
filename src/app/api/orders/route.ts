import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { OrderStatus, ServiceType } from "@/lib/types";

const gameNames = [
  "三角洲行动",
  "无畏契约",
  "英雄联盟",
  "王者荣耀",
  "和平精英",
  "永劫无间",
  "绝地求生",
  "CS2",
  "Apex 英雄",
  "原神",
  "鸣潮",
  "崩坏：星穹铁道",
  "云顶之弈",
  "DNF",
  "穿越火线",
];

const serviceTypes: ServiceType[] = [
  "fun_play",
  "rank_boost",
  "rank_coach",
  "evacuation",
  "materials",
  "task",
  "dungeon",
  "newbie",
  "voice",
  "custom",
  "escort",
  "rank",
  "fun",
];

const orderStatuses: OrderStatus[] = [
  "pending_payment",
  "pending",
  "accepted",
  "in_progress",
  "pending_confirm",
  "completed",
  "cancelled",
  "disputed",
];

type OrderAction = "pay" | "cancel" | "accept" | "start" | "finish" | "confirm" | "dispute";

function normalizeOrder(order: Record<string, unknown>) {
  return {
    ...order,
    price: Number(order.price) || 0,
    platform_fee: Number(order.platform_fee) || 0,
    escort_income: Number(order.escort_income) || 0,
    duration_hours: Number(order.duration_hours) || 0,
    requirement: order.requirement || order.remark || "",
  };
}

function getOrderNo() {
  const now = new Date();
  const dateText = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomText = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `DE${dateText}${randomText}`;
}

function canCancel(status: string) {
  return status === "pending_payment" || status === "pending";
}

function getSelectFields() {
  return "*, escorts(id,user_id,nickname,price,status), customer:customer_id(id,nickname,email)";
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
  const id = url.searchParams.get("id") || "";
  const profile = authResult.data.profile;

  let query = supabase.from("orders").select(getSelectFields()).order("created_at", { ascending: false });

  if (id) {
    query = query.eq("id", id);
  }

  if (status && status !== "all") {
    if (!orderStatuses.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "订单状态不正确。" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  if (scope === "admin") {
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "没有管理员权限。" }, { status: 403 });
    }
  } else if (scope === "escort") {
    if (profile.role !== "escort" && profile.role !== "admin") {
      return NextResponse.json({ error: "没有护航师权限。" }, { status: 403 });
    }

    if (profile.role !== "admin") {
      const { data: escortProfile, error: escortError } = await supabase
        .from("escorts")
        .select("id,status,approved")
        .eq("user_id", profile.id)
        .eq("status", "active")
        .maybeSingle();

      if (escortError) {
        return NextResponse.json({ error: escortError.message }, { status: 500 });
      }

      if (!escortProfile || !escortProfile.approved) {
        return NextResponse.json({ error: "护航师资料未开通或已被禁用。" }, { status: 403 });
      }

      query = query.eq("escort_user_id", profile.id);
    }
  } else {
    query = query.eq("customer_id", profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: ((data || []) as unknown as Array<Record<string, unknown>>).map((order) => normalizeOrder(order)) });
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
    const escortId = String(body.escort_id || "").trim() || null;
    const gameName = String(body.game_name || "").trim();
    const serviceType = String(body.service_type || "").trim() as ServiceType;
    const gameMode = String(body.game_mode || "").trim();
    const serverRegion = String(body.server_region || "").trim();
    const requirement = String(body.requirement || "").trim();
    const contactWechat = String(body.contact_wechat || "").trim();
    const contactQq = String(body.contact_qq || "").trim();
    const contactPhone = String(body.contact_phone || "").trim();
    const durationHours = Number(body.duration_hours);
    const startTime = String(body.start_time || "").trim();

    if (!gameNames.includes(gameName)) {
      return NextResponse.json({ error: "请选择平台支持的游戏。" }, { status: 400 });
    }

    if (!serviceTypes.includes(serviceType)) {
      return NextResponse.json({ error: "服务类型不正确。" }, { status: 400 });
    }

    if (!gameMode || gameMode.length > 50) {
      return NextResponse.json({ error: "游戏模式不能为空，且不能超过 50 个字。" }, { status: 400 });
    }

    if (!serverRegion || serverRegion.length > 50) {
      return NextResponse.json({ error: "服务器或区服不能为空，且不能超过 50 个字。" }, { status: 400 });
    }

    if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
      return NextResponse.json({ error: "服务时长必须大于 0，且不能超过 24 小时。" }, { status: 400 });
    }

    if (requirement.length < 5 || requirement.length > 500) {
      return NextResponse.json({ error: "需求说明需要填写 5 到 500 个字。" }, { status: 400 });
    }

    if (!contactWechat && !contactQq && !contactPhone) {
      return NextResponse.json({ error: "微信、QQ、手机号至少填写一个。" }, { status: 400 });
    }

    let escortUserId: string | null = null;
    let unitPrice = 88;

    if (escortId) {
      const { data: escort, error: escortError } = await supabase
        .from("escorts")
        .select("id,user_id,price,approved,status")
        .eq("id", escortId)
        .maybeSingle();

      if (escortError) {
        return NextResponse.json({ error: escortError.message }, { status: 500 });
      }

      if (!escort || escort.status !== "active" || !escort.approved) {
        return NextResponse.json({ error: "护航师不存在或暂不可接单。" }, { status: 404 });
      }

      escortUserId = escort.user_id;
      unitPrice = Number(escort.price) || unitPrice;
    }

    const price = Math.max(1, Number((unitPrice * durationHours).toFixed(2)));
    const platformFee = Number((price * 0.12).toFixed(2));
    const escortIncome = Number((price - platformFee).toFixed(2));

    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_no: getOrderNo(),
        customer_id: authResult.data.profile.id,
        user_id: authResult.data.profile.id,
        escort_id: escortId,
        escort_user_id: escortUserId,
        game_name: gameName,
        service_type: serviceType,
        game_mode: gameMode,
        server_region: serverRegion,
        start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        duration_hours: durationHours,
        requirement,
        remark: requirement,
        price,
        platform_fee: platformFee,
        escort_income: escortIncome,
        contact_wechat: contactWechat || null,
        contact_qq: contactQq || null,
        contact_phone: contactPhone || null,
        payment_status: "unpaid",
        status: "pending_payment",
      })
      .select(getSelectFields())
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeOrder(data as unknown as Record<string, unknown>) }, { status: 201 });
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
    const action = String(body.action || "").trim() as OrderAction;
    const cancelReason = String(body.cancel_reason || "").trim();
    const profile = authResult.data.profile;

    if (!orderId) {
      return NextResponse.json({ error: "订单编号不能为空。" }, { status: 400 });
    }

    if (!["pay", "cancel", "accept", "start", "finish", "confirm", "dispute"].includes(action)) {
      return NextResponse.json({ error: "订单操作不正确。" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, escorts(id,user_id,nickname,price,status,approved)")
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
      escort_user_id?: string | null;
      status: OrderStatus;
      escorts?: { user_id?: string | null; status?: string | null; approved?: boolean | null } | null;
    };
    const isCustomer = orderRecord.customer_id === profile.id || orderRecord.user_id === profile.id;
    const isEscort = orderRecord.escort_user_id === profile.id || orderRecord.escorts?.user_id === profile.id;
    const isActiveEscort = isEscort && orderRecord.escorts?.status === "active" && Boolean(orderRecord.escorts?.approved);
    const isAdmin = profile.role === "admin";
    const now = new Date().toISOString();
    const updatePayload: Record<string, string | null> = {};

    if (action === "pay") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "只有下单用户可以确认模拟支付。" }, { status: 403 });
      }
      if (orderRecord.status !== "pending_payment") {
        return NextResponse.json({ error: "只有待支付订单可以确认支付。" }, { status: 400 });
      }
      updatePayload.status = "pending";
      updatePayload.payment_status = "paid";
      updatePayload.paid_at = now;
    }

    if (action === "cancel") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "无权取消该订单。" }, { status: 403 });
      }
      if (!canCancel(orderRecord.status) && !isAdmin) {
        return NextResponse.json({ error: "当前状态不能取消订单。" }, { status: 400 });
      }
      if (orderRecord.status === "completed") {
        return NextResponse.json({ error: "已完成订单不能取消。" }, { status: 400 });
      }
      updatePayload.status = "cancelled";
      updatePayload.cancel_reason = cancelReason || "用户取消";
      updatePayload.cancelled_at = now;
    }

    if (action === "accept") {
      if (!isActiveEscort && !isAdmin) {
        return NextResponse.json({ error: "只有当前订单护航师可以接单。" }, { status: 403 });
      }
      if (orderRecord.status !== "pending") {
        return NextResponse.json({ error: "只有待接单订单可以接单。" }, { status: 400 });
      }
      updatePayload.status = "accepted";
      updatePayload.accepted_at = now;
    }

    if (action === "start") {
      if (!isActiveEscort && !isAdmin) {
        return NextResponse.json({ error: "只有当前订单护航师可以开始服务。" }, { status: 403 });
      }
      if (orderRecord.status !== "accepted") {
        return NextResponse.json({ error: "只有已接单订单可以开始服务。" }, { status: 400 });
      }
      updatePayload.status = "in_progress";
      updatePayload.started_at = now;
    }

    if (action === "finish") {
      if (!isActiveEscort && !isAdmin) {
        return NextResponse.json({ error: "只有当前订单护航师可以完成服务。" }, { status: 403 });
      }
      if (orderRecord.status !== "in_progress") {
        return NextResponse.json({ error: "只有服务中订单可以提交完成。" }, { status: 400 });
      }
      updatePayload.status = "pending_confirm";
      updatePayload.completed_at = now;
    }

    if (action === "confirm") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "只有下单用户可以确认完成。" }, { status: 403 });
      }
      if (orderRecord.status !== "pending_confirm") {
        return NextResponse.json({ error: "只有待确认订单可以确认完成。" }, { status: 400 });
      }
      updatePayload.status = "completed";
      updatePayload.confirmed_at = now;
    }

    if (action === "dispute") {
      if (!isCustomer && !isAdmin) {
        return NextResponse.json({ error: "只有下单用户或管理员可以发起申诉。" }, { status: 403 });
      }
      if (orderRecord.status === "cancelled" || orderRecord.status === "completed") {
        return NextResponse.json({ error: "当前订单不能发起申诉。" }, { status: 400 });
      }
      updatePayload.status = "disputed";
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select(getSelectFields())
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeOrder(data as unknown as Record<string, unknown>) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新订单状态失败。" }, { status: 500 });
  }
}
