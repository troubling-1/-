import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { ReportStatus, ReportType } from "@/lib/types";

const reportTypes: ReportType[] = ["no_show", "bad_attitude", "private_trade", "fraud", "abuse", "other"];
const reportStatuses: ReportStatus[] = ["pending", "processing", "resolved", "rejected"];

function normalizeReport(report: Record<string, unknown>) {
  return {
    ...report,
    target_user_id: report.target_user_id || null,
    order_id: report.order_id || null,
    review_id: report.review_id || null,
    admin_note: report.admin_note || null,
  };
}

async function canUseOrder(supabase: NonNullable<ReturnType<typeof createServiceSupabaseClient>>, orderId: string, profileId: string, isAdmin: boolean) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id,customer_id,user_id,escort_id,escorts(user_id)")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    return { allowed: false, error: error.message, status: 500 };
  }

  if (!order) {
    return { allowed: false, error: "订单不存在。", status: 404 };
  }

  const orderRecord = order as {
    customer_id?: string | null;
    user_id?: string | null;
    escorts?: { user_id?: string | null } | Array<{ user_id?: string | null }> | null;
  };
  const escortUserId = Array.isArray(orderRecord.escorts) ? orderRecord.escorts[0]?.user_id : orderRecord.escorts?.user_id;
  const allowed = isAdmin || orderRecord.customer_id === profileId || orderRecord.user_id === profileId || escortUserId === profileId;

  return { allowed, error: allowed ? null : "只有订单参与方可以举报该订单。", status: allowed ? 200 : 403 };
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

  let query = supabase.from("reports").select("*").order("created_at", { ascending: false });

  if (scope === "admin") {
    if (profile.role !== "admin") {
      return NextResponse.json({ error: "无管理员权限。" }, { status: 403 });
    }
  } else {
    query = query.eq("reporter_id", profile.id);
  }

  if (status && status !== "all") {
    if (!reportStatuses.includes(status as ReportStatus)) {
      return NextResponse.json({ error: "举报状态不正确。" }, { status: 400 });
    }
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data || []).map((report) => normalizeReport(report)) });
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
    const profile = authResult.data.profile;
    const type = String(body.type || "").trim() as ReportType;
    const reason = String(body.reason || "").trim();
    const description = String(body.description || "").trim();
    const targetUserId = String(body.target_user_id || "").trim() || null;
    const orderId = String(body.order_id || "").trim() || null;
    const reviewId = String(body.review_id || "").trim() || null;

    if (!reportTypes.includes(type)) {
      return NextResponse.json({ error: "举报类型不正确。" }, { status: 400 });
    }

    if (reason.length < 2 || reason.length > 80) {
      return NextResponse.json({ error: "举报原因需要填写 2 到 80 个字。" }, { status: 400 });
    }

    if (description.length < 5 || description.length > 1000) {
      return NextResponse.json({ error: "详细说明需要填写 5 到 1000 个字。" }, { status: 400 });
    }

    if (!targetUserId && !orderId && !reviewId) {
      return NextResponse.json({ error: "请至少选择一个举报对象。" }, { status: 400 });
    }

    if (orderId) {
      const orderAccess = await canUseOrder(supabase, orderId, profile.id, profile.role === "admin");

      if (!orderAccess.allowed) {
        return NextResponse.json({ error: orderAccess.error }, { status: orderAccess.status });
      }
    }

    if (reviewId) {
      const { data: review, error: reviewError } = await supabase.from("reviews").select("id,order_id").eq("id", reviewId).maybeSingle();

      if (reviewError) {
        return NextResponse.json({ error: reviewError.message }, { status: 500 });
      }

      if (!review) {
        return NextResponse.json({ error: "评价不存在。" }, { status: 404 });
      }
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: profile.id,
        target_user_id: targetUserId,
        order_id: orderId,
        review_id: reviewId,
        type,
        reason,
        description,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeReport(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交举报失败。" }, { status: 500 });
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
    const reportId = String(body.id || "").trim();
    const status = String(body.status || "").trim() as ReportStatus;
    const adminNote = String(body.admin_note || "").trim();

    if (!reportId) {
      return NextResponse.json({ error: "举报编号不能为空。" }, { status: 400 });
    }

    if (!reportStatuses.includes(status)) {
      return NextResponse.json({ error: "举报状态不正确。" }, { status: 400 });
    }

    if (adminNote.length > 500) {
      return NextResponse.json({ error: "处理备注不能超过 500 个字。" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("reports")
      .update({ status, admin_note: adminNote || null })
      .eq("id", reportId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeReport(data) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "处理举报失败。" }, { status: 500 });
  }
}
