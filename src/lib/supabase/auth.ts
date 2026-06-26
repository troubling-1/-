import "server-only";

import type { User } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { User as AppUser, UserRole } from "@/lib/types";

export type AuthProfile = {
  authUser: User;
  profile: AppUser;
};

export function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const [type, token] = authHeader.split(" ");

  if (type.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function getDefaultNickname(authUser: User) {
  const metadataNickname = String(authUser.user_metadata?.nickname || "").trim();
  const emailName = authUser.email?.split("@")[0]?.trim();
  return metadataNickname || emailName || "玩家";
}

export async function getAuthProfile(request: Request): Promise<{ data: AuthProfile | null; error: string | null; status: number }> {
  const token = getBearerToken(request);

  if (!token) {
    return { data: null, error: "请先登录。", status: 401 };
  }

  const supabase = createServiceSupabaseClient();

  if (!supabase) {
    return { data: null, error: "Supabase 服务端环境变量未配置。", status: 500 };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return { data: null, error: "登录状态无效，请重新登录。", status: 401 };
  }

  const authUser = authData.user;
  const { data: existingProfile, error: selectError } = await supabase.from("users").select("*").eq("id", authUser.id).maybeSingle();

  if (selectError) {
    return { data: null, error: selectError.message, status: 500 };
  }

  let profile = existingProfile as AppUser | null;

  if (!profile) {
    const { data: insertedProfile, error: insertError } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email || null,
        nickname: getDefaultNickname(authUser),
        role: "customer" satisfies UserRole,
        status: "active",
      })
      .select("*")
      .single();

    if (insertError) {
      return { data: null, error: insertError.message, status: 500 };
    }

    profile = insertedProfile as AppUser;
  }

  if (profile.status === "banned") {
    return { data: null, error: "账号已封禁，禁止登录。", status: 403 };
  }

  return { data: { authUser, profile }, error: null, status: 200 };
}

export async function requireAdminProfile(request: Request) {
  const result = await getAuthProfile(request);

  if (result.error || !result.data) {
    return result;
  }

  if (result.data.profile.role !== "admin") {
    return { data: null, error: "无管理员权限。", status: 403 };
  }

  return result;
}
