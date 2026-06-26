"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function isLocalSupabaseUrl(url: URL) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

export function getBrowserSupabaseConfigError() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return "Supabase 登录未配置：请检查 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY。";
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    return "Supabase URL 格式错误：NEXT_PUBLIC_SUPABASE_URL 必须是完整地址，例如 https://你的项目.supabase.co。";
  }

  if (parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
    return "Supabase URL 配置错误：NEXT_PUBLIC_SUPABASE_URL 只填写项目根地址，不要拼接 /auth/v1 或其他路径。";
  }

  if (parsedUrl.protocol !== "https:" && !(parsedUrl.protocol === "http:" && isLocalSupabaseUrl(parsedUrl))) {
    return "Supabase URL 协议错误：线上环境必须使用 https:// 开头的 Supabase 项目地址。";
  }

  return null;
}

export function createBrowserSupabaseClient() {
  const configError = getBrowserSupabaseConfigError();

  if (configError) {
    throw new Error(configError);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    );
  }

  return browserClient;
}
