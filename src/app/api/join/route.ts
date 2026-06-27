import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getAuthProfile } from "@/lib/supabase/auth";

function splitTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }

  return String(value || "")
    .split(/[，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }

  return String(value || "")
    .split(/[，,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeApplication<T extends Record<string, unknown> | null>(application: T) {
  if (!application) {
    return null;
  }

  return {
    ...application,
    kd: Number(application.kd) || 0,
    price: Number(application.price) || 0,
    good_at_modes: normalizeTags(application.good_at_modes),
    good_at_maps: normalizeTags(application.good_at_maps),
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

  const { data, error } = await supabase
    .from("escort_applications")
    .select("*")
    .eq("user_id", authResult.data.profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: normalizeApplication(data) });
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
    const nickname = String(body.nickname || "").trim();
    const gameId = String(body.game_id || "").trim();
    const contactWechat = String(body.contact_wechat || "").trim();
    const contactQq = String(body.contact_qq || "").trim();
    const rank = String(body.rank || "").trim();
    const kd = Number(body.kd);
    const goodAtModes = normalizeTags(body.good_at_modes);
    const goodAtMaps = normalizeTags(body.good_at_maps);
    const price = Number(body.price);
    const intro = String(body.intro || "").trim();

    if (!nickname || nickname.length > 30) {
      return NextResponse.json({ error: "护航师昵称不能为空，且不能超过 30 个字。" }, { status: 400 });
    }

    if (!gameId || gameId.length > 50) {
      return NextResponse.json({ error: "游戏 ID 不能为空，且不能超过 50 个字。" }, { status: 400 });
    }

    if (!contactWechat && !contactQq) {
      return NextResponse.json({ error: "微信或 QQ 至少填写一个，方便审核联系。" }, { status: 400 });
    }

    if (!rank) {
      return NextResponse.json({ error: "请填写当前段位。" }, { status: 400 });
    }

    if (!Number.isFinite(kd) || kd < 0 || kd > 20) {
      return NextResponse.json({ error: "KD 需要填写 0 到 20 之间的数字。" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 1 || price > 9999) {
      return NextResponse.json({ error: "服务价格需要填写 1 到 9999 之间的数字。" }, { status: 400 });
    }

    if (intro.length < 10 || intro.length > 500) {
      return NextResponse.json({ error: "个人简介需要填写 10 到 500 个字。" }, { status: 400 });
    }

    const { data: pendingApplication, error: pendingError } = await supabase
      .from("escort_applications")
      .select("id")
      .eq("user_id", authResult.data.profile.id)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 500 });
    }

    if (pendingApplication) {
      return NextResponse.json({ error: "你已经提交过待审核申请，请等待管理员审核。" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("escort_applications")
      .insert({
        user_id: authResult.data.profile.id,
        nickname,
        game_id: gameId,
        contact_wechat: contactWechat || null,
        contact_qq: contactQq || null,
        rank,
        kd,
        good_at_modes: goodAtModes,
        good_at_maps: goodAtMaps,
        price,
        intro,
        status: "pending",
        reject_reason: null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: normalizeApplication(data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "提交入驻申请失败。" }, { status: 500 });
  }
}
