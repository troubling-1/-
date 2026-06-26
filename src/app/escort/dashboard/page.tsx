import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orders } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

export default function EscortDashboardPage() {
  const totalIncome = orders.reduce((sum, order) => sum + order.price, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">护航师后台</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>今日收入</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-primary">{formatMoney(totalIncome)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>待处理订单</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{orders.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>审核状态</CardTitle></CardHeader>
          <CardContent><Badge tone="success">已通过</Badge></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>资料与价格设置</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Input placeholder="护航师昵称" defaultValue="夜枭" />
            <Input placeholder="每局价格" type="number" min={0} defaultValue={88} />
            <Textarea placeholder="个人简介" defaultValue="主打稳定撤离和物资护送。" />
            <Button>保存资料</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>提现申请</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Input placeholder="提现金额" type="number" min={1} />
            <Input placeholder="收款账号" />
            <Button>提交申请</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>订单管理</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col justify-between gap-3 rounded-md border border-border bg-black/30 p-4 md:flex-row md:items-center">
              <div>
                <p className="font-medium">{order.id}</p>
                <p className="text-sm text-muted-foreground">{order.remark}</p>
              </div>
              <Button variant="outline">处理订单</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
