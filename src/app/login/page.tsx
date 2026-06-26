"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginLocalUser } from "@/lib/local-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

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
      setMessage("邮箱和密码不能为空");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("登录成功");
      router.push("/user");
      router.refresh();
    } catch {
      try {
        loginLocalUser(email, password);
        setMessage("本地登录成功");
        router.push("/user");
        router.refresh();
      } catch (localError) {
        setMessage(localError instanceof Error ? localError.message : "登录失败");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>有 Supabase 配置时使用真实登录；未配置时使用本地模拟账号。</CardDescription>
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
