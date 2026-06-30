import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const authResult = await getAuthProfile(request);

  if (authResult.error || !authResult.data) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const profile = authResult.data.profile;

  if (profile.role !== "escort") {
    return NextResponse.json({ error: "无护航师权限。" }, { status: 403 });
  }

  if (profile.status !== "active") {
    return NextResponse.json({ error: "账号状态不可用。" }, { status: 403 });
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase 服务端环境变量未配置。" }, { status: 500 });
  }

  const { data: escort, error } = await supabase
    .from("escorts")
    .select("*")
    .eq("user_id", profile.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!escort) {
    return NextResponse.json({ error: "护航师资料未开通或已被禁用。" }, { status: 403 });
  }

  return NextResponse.json({ data: escort });
}
