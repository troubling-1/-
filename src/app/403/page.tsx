import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-primary">403</p>
          <h1 className="mt-2 text-2xl font-bold">无权限访问</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">当前账号没有访问该页面的权限，请切换账号或返回首页。</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">返回首页</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">重新登录</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
