"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAuthProfile, getRoleHomePath } from "@/lib/auth-client";
import { createBrowserSupabaseClient, getBrowserSupabaseConfigError } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setMessage("邮箱和密码不能为空。");
      return;
    }

    const configError = getBrowserSupabaseConfigError();
    if (configError) {
      setMessage(`${configError} 当前不会发起 Supabase 登录请求。`);
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message || "登录失败，请检查邮箱和密码。");
        return;
      }

      const profile = await fetchAuthProfile();

      if (!profile) {
        await supabase.auth.signOut();
        setMessage("登录成功但读取账号资料失败，请重新登录。");
        return;
      }

      if (profile.status === "banned") {
        await supabase.auth.signOut();
        setMessage("账号已封禁，禁止登录。");
        return;
      }

      setMessage("登录成功。");
      router.push(getRoleHomePath(profile.role));
      router.refresh();
    } catch (error) {
      try {
        await createBrowserSupabaseClient().auth.signOut();
      } catch {
        // 忽略未配置 Supabase 时的退出失败。
      }
      setMessage(error instanceof Error ? error.message : "登录失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>使用 Supabase 账号登录，登录后会按账号角色进入对应页面。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleLogin}>
            <Input name="email" type="email" placeholder="邮箱" autoComplete="email" />
            <Input name="password" type="password" placeholder="密码" autoComplete="current-password" />
            {message ? <p className="rounded-md border border-border bg-muted p-3 text-sm">{message}</p> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "登录中..." : "登录"}
            </Button>
            <Link className="text-sm text-primary" href="/register">
              还没有账号？去注册
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
