import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const userCenterItems = [
  ["个人资料", "昵称、头像、手机号和登录账号。"],
  ["订单记录", "查看历史订单和当前订单状态。"],
  ["评价记录", "查看已发布评价和待评价订单。"],
  ["钱包", "余额、消费记录和退款记录。"],
  ["设置", "通知、隐私和账号安全。"],
  ["成为护航师", "提交入驻资料并等待平台审核。"],
];

export default function UserCenterPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">用户中心</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userCenterItems.map(([title, text]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{text}</p>
              {title === "成为护航师" ? (
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/escort/apply">申请入驻</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
