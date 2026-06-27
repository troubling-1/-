import { NextResponse } from "next/server";
import { requireAdminProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const authResult = await requireAdminProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("escort_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
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
    const applicationId = String(body.id || "").trim();
    const action = String(body.action || "").trim();
    const rejectReason = String(body.reject_reason || "").trim();

    if (!applicationId) {
      return NextResponse.json({ error: "申请编号不能为空。" }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "审核操作不正确。" }, { status: 400 });
    }

    if (action === "reject" && rejectReason.length < 2) {
      return NextResponse.json({ error: "拒绝原因至少填写 2 个字。" }, { status: 400 });
    }

    const { data: application, error: applicationError } = await supabase
      .from("escort_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      return NextResponse.json({ error: applicationError?.message || "申请不存在。" }, { status: 404 });
    }

    if (action === "reject") {
      const { data, error } = await supabase
        .from("escort_applications")
        .update({ status: "rejected", reject_reason: rejectReason })
        .eq("id", applicationId)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    const { error: approveError } = await supabase
      .from("escort_applications")
      .update({ status: "approved", reject_reason: null })
      .eq("id", applicationId);

    if (approveError) {
      return NextResponse.json({ error: approveError.message }, { status: 500 });
    }

    const { error: roleError } = await supabase.from("users").update({ role: "escort" }).eq("id", application.user_id);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    const { error: escortError } = await supabase.from("escorts").upsert(
      {
        user_id: application.user_id,
        nickname: application.nickname,
        rank: application.rank,
        kd: application.kd,
        price: application.price,
        bio: application.intro,
        approved: true,
        online_status: false,
      },
      { onConflict: "user_id" },
    );

    if (escortError) {
      return NextResponse.json({ error: escortError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id: applicationId, status: "approved" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "审核申请失败。" }, { status: 500 });
  }
}
