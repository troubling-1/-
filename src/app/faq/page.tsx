import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "常见问题",
  description:
    "三角洲行动护航陪玩常见问题，包含如何下单、如何选择服务、售后退款、客服响应和禁止私下交易说明。",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "三角洲行动护航常见问题 | Delta Escort",
    description: "了解带撤离、物资护送、上分护航、退款售后和举报处理说明。",
    url: "/faq",
    type: "article",
  },
};

const questions = [
  {
    question: "Delta Escort 提供哪些三角洲行动服务？",
    answer: "当前支持带撤离、战备物资护送、上分护航和娱乐陪玩。下单前可以先联系客服确认服务时间、区服和具体目标。",
  },
  {
    question: "下单后多久有护航师接单？",
    answer: "在线护航师通常会在 3-10 分钟内响应。高峰期或指定护航师时可能需要稍等，客服会协助确认。",
  },
  {
    question: "可以退款或取消订单吗？",
    answer: "服务未开始且双方未确认时，可以联系客服协助取消。服务已开始后，会按订单记录、聊天记录和实际完成情况处理。",
  },
  {
    question: "为什么不建议私下交易？",
    answer: "私下交易缺少平台订单记录，出现跳单、服务未完成或售后争议时很难核实。建议通过平台下单并保留沟通记录。",
  },
  {
    question: "遇到诱导转账或服务问题怎么办？",
    answer: "可以通过举报入口提交，或直接联系站内客服。请尽量保留聊天记录、订单编号和问题描述。",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="max-w-3xl">
        <p className="text-sm text-primary">常见问题</p>
        <h1 className="mt-2 text-3xl font-bold">三角洲行动护航下单问题说明</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          这里整理了玩家下单前最常问的问题，帮助你快速判断该选什么服务、如何联系平台、出现售后问题怎么处理。
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        {questions.map((item) => (
          <Card key={item.question}>
            <CardContent className="p-5">
              <h2 className="font-bold">{item.question}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-11">
          <Link href="/orders/create">立即下单</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/chat">联系客服</Link>
        </Button>
      </div>
    </div>
  );
}
