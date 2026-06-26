import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "平台规则",
  description:
    "Delta Escort 三角洲行动护航平台规则，包含禁止私下交易、禁止跳单、售后处理、举报处理和退款说明。",
  alternates: {
    canonical: "/rules",
  },
  openGraph: {
    title: "平台规则 | Delta Escort",
    description: "查看三角洲行动护航订单规则、退款说明、举报处理和禁止跳单说明。",
    url: "/rules",
    type: "article",
  },
};

const rules = [
  {
    title: "禁止私下交易",
    text: "玩家和护航师应通过平台订单沟通服务内容，避免私下转账后无法核实服务过程和售后责任。",
  },
  {
    title: "禁止跳单",
    text: "平台订单确认后，不允许绕过平台继续交易。跳单会影响双方权益，也会导致后续售后无法处理。",
  },
  {
    title: "服务前确认",
    text: "下单前请确认区服、预约时间、语音方式、服务目标和价格。信息不明确时建议先联系客服。",
  },
  {
    title: "退款说明",
    text: "服务未开始且双方未确认时，可以联系客服协助取消。服务已开始后，根据订单记录、沟通记录和完成情况处理。",
  },
  {
    title: "举报处理",
    text: "如遇诱导私下转账、辱骂、消极服务、虚假资料等情况，可以通过举报入口提交，平台会按记录核实。",
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="max-w-3xl">
        <p className="text-sm text-primary">平台规则</p>
        <h1 className="mt-2 text-3xl font-bold">保障玩家和护航师的基础规则</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          平台规则的目标是保留订单凭证、减少售后争议，并让玩家下单前知道哪些行为不被允许。
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rules.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5">
              <h2 className="font-bold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-11">
          <Link href="/orders/create">按规则下单</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/reports/create">提交举报</Link>
        </Button>
      </div>
    </div>
  );
}
