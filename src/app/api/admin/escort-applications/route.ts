import { NextResponse } from "next/server";
import { requireAdminProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[，,、\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeApplication<T extends Record<string, unknown> | null>(application: T) {
  if (!application) return null;

  return {
    ...application,
    kd: Number(application.kd) || 0,
    price: Number(application.price) || 0,
    good_at_modes: normalizeTags(application.good_at_modes),
    good_at_maps: normalizeTags(application.good_at_maps),
  };
}

function normalizeEscort<T extends Record<string, unknown> | null>(escort: T) {
  if (!escort) return null;

  return {
    ...escort,
    kd: Number(escort.kd) || 0,
    price: Number(escort.price) || 0,
    good_at_modes: normalizeTags(escort.good_at_modes),
    good_at_maps: normalizeTags(escort.good_at_maps),
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

  const { data: applications, error: applicationsError } = await supabase
    .from("escort_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (applicationsError) {
    return NextResponse.json({ error: applicationsError.message }, { status: 500 });
  }

  const { data: escorts, error: escortsError } = await supabase
    .from("escorts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (escortsError) {
    return NextResponse.json({ error: escortsError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (applications || []).map((item) => normalizeApplication(item)),
    escorts: (escorts || []).map((item) => normalizeEscort(item)),
  });
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

      const { data: approvedApplication, error: approvedError } = await supabase
        .from("escort_applications")
        .select("id")
        .eq("user_id", application.user_id)
        .eq("status", "approved")
        .maybeSingle();

      if (approvedError) {
        return NextResponse.json({ error: approvedError.message }, { status: 500 });
      }

      if (!approvedApplication) {
        const { error: roleError } = await supabase.from("users").update({ role: "customer" }).eq("id", application.user_id);

        if (roleError) {
          return NextResponse.json({ error: roleError.message }, { status: 500 });
        }

        const { error: escortError } = await supabase
          .from("escorts")
          .update({ status: "disabled", approved: false })
          .eq("user_id", application.user_id);

        if (escortError) {
          return NextResponse.json({ error: escortError.message }, { status: 500 });
        }
      }

      return NextResponse.json({ data: normalizeApplication(data) });
    }

    const { data: approvedApplication, error: approveError } = await supabase
      .from("escort_applications")
      .update({ status: "approved", reject_reason: null })
      .eq("id", applicationId)
      .select("*")
      .single();

    if (approveError) {
      return NextResponse.json({ error: approveError.message }, { status: 500 });
    }

    const { error: roleError } = await supabase
      .from("users")
      .update({ role: "escort", status: "active" })
      .eq("id", application.user_id);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    const { data: escort, error: escortError } = await supabase
      .from("escorts")
      .upsert(
        {
          user_id: application.user_id,
          application_id: application.id,
          nickname: application.nickname,
          game_id: application.game_id,
          contact_wechat: application.contact_wechat,
          contact_qq: application.contact_qq,
          rank: application.rank,
          kd: application.kd,
          good_at_modes: normalizeTags(application.good_at_modes),
          good_at_maps: normalizeTags(application.good_at_maps),
          price: application.price,
          intro: application.intro,
          bio: application.intro,
          status: "active",
          approved: true,
          online_status: false,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();

    if (escortError) {
      return NextResponse.json({ error: escortError.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeApplication(approvedApplication), escort: normalizeEscort(escort) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "审核申请失败。" }, { status: 500 });
  }
}
