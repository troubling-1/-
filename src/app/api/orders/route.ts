import { NextResponse } from "next/server";
import { orders } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderStatus, ServiceType } from "@/lib/types";

const serviceTypes: ServiceType[] = ["escort", "evacuation", "materials", "rank", "fun"];
const orderStatuses: OrderStatus[] = ["pending", "accepted", "in_progress", "completed", "cancelled"];

export async function GET() {
  return NextResponse.json({ data: orders, source: "mock" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body.user_id || "").trim();
    const escortId = String(body.escort_id || "").trim();
    const serviceType = String(body.service_type || "").trim() as ServiceType;
    const price = Number(body.price);
    const remark = String(body.remark || "").trim();
    const appointmentTime = String(body.appointment_time || "").trim();

    if (!escortId) {
      return NextResponse.json({ error: "护航师不能为空" }, { status: 400 });
    }

    if (!serviceTypes.includes(serviceType)) {
      return NextResponse.json({ error: "服务类型不正确" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "订单价格不正确" }, { status: 400 });
    }

    if (remark.length < 5 || remark.length > 500) {
      return NextResponse.json({ error: "需求说明长度需要在 5 到 500 字之间" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          data: {
            id: `mock-${Date.now()}`,
            user_id: userId || "local-user",
            escort_id: escortId,
            service_type: serviceType,
            price,
            remark,
            appointment_time: appointmentTime || null,
            status: "pending",
            cancel_reason: null,
            cancelled_at: null,
            created_at: new Date().toISOString(),
          },
          source: "mock",
        },
        { status: 201 },
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId || null,
        escort_id: escortId,
        service_type: serviceType,
        price,
        remark,
        appointment_time: appointmentTime || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, source: "supabase" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "创建订单失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const orderId = String(body.id || "").trim();
    const status = String(body.status || "").trim() as OrderStatus;
    const cancelReason = String(body.cancel_reason || "").trim();
    const cancelledAt = status === "cancelled" ? new Date().toISOString() : null;

    if (!orderId) {
      return NextResponse.json({ error: "订单编号不能为空" }, { status: 400 });
    }

    if (!orderStatuses.includes(status)) {
      return NextResponse.json({ error: "订单状态不正确" }, { status: 400 });
    }

    if (status === "cancelled" && (cancelReason.length < 2 || cancelReason.length > 100)) {
      return NextResponse.json({ error: "取消原因需要填写 2 到 100 个字" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({
        data: {
          id: orderId,
          status,
          cancel_reason: status === "cancelled" ? cancelReason : null,
          cancelled_at: cancelledAt,
        },
        source: "mock",
      });
    }

    const updatePayload =
      status === "cancelled"
        ? { status, cancel_reason: cancelReason, cancelled_at: cancelledAt }
        : { status, cancel_reason: null, cancelled_at: null };

    const { data, error } = await supabase.from("orders").update(updatePayload).eq("id", orderId).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, source: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "更新订单状态失败" }, { status: 500 });
  }
}
