import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Headphones,
  MessageSquareWarning,
  ShieldCheck,
  Siren,
  Star,
  UserCheck,
} from "lucide-react";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { HomeLivePanel } from "@/components/site/home-live-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

const coreServices = ["带撤离", "物资护送", "上分护航", "娱乐陪玩"];

const servicePackages = [
  { name: "带撤离护航", tag: "热门", price: 88, desc: "适合想稳定撤离、完成任务、降低掉装风险的玩家。" },
  { name: "战备物资护送", tag: "高价值", price: 108, desc: "针对高价值物资局，优先保障安全转点和顺利带出。" },
  { name: "上分护航", tag: "稳定", price: 58, desc: "适合排位上分、练枪配合、队伍沟通和节奏带动。" },
];

const guarantees = [
  { icon: ShieldCheck, title: "平台交易保障", text: "建议通过平台订单沟通和记录服务过程，避免私下转账、跳单和售后无凭证。" },
  { icon: CheckCircle2, title: "订单售后保障", text: "订单异常、服务未开始、沟通不一致等情况，可通过订单记录提交反馈。" },
  { icon: Headphones, title: "客服响应保障", text: "下单前可先联系客服确认服务类型、时间、价格和注意事项。" },
];

const userReviews = [
  { name: "北京玩家 A", service: "带撤离护航", text: "下单前客服先问了区服和目标，护航师没有乱冲，最后物资顺利带出。" },
  { name: "广东玩家 B", service: "物资护送", text: "高价值物资局比较怕掉装，护航师会先看路线和撤离点，沟通很清楚。" },
  { name: "江苏玩家 C", service: "上分护航", text: "不是只带打，过程中会提醒站位和转点，打完还能简单复盘。" },
];

const platformRules = [
  "下单前先确认服务类型、预约时间、区服和语音方式。",
  "禁止私下交易，避免付款后无法追踪订单和售后。",
  "禁止跳单，护航师和玩家都需要保留平台订单记录。",
  "如遇诱导转账、辱骂、消极服务，可通过举报入口提交。",
];

export default function HomePage() {
  return (
    <div className="bg-[#080a0d] text-foreground">
      <section className="relative overflow-hidden border-b border-[#c8a45d]/15 bg-[#07080a]">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(200,164,93,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(200,164,93,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-8 px-4 py-8 sm:py-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-3xl">
            <Badge className="border-[#c8a45d]/40 bg-[#c8a45d]/10 text-[#e1c47d]">三角洲行动护航陪玩平台</Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
              三角洲行动护航接单
              <span className="block text-[#e1c47d]">带撤离、护物资、陪上分</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
              面向中国大陆玩家的三角洲行动护航平台，支持带撤离、物资护送、上分护航、娱乐陪玩。下单前可先联系客服确认服务时间和需求。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {coreServices.map((service) => (
                <span key={service} className="rounded-sm border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-zinc-200">
                  {service}
                </span>
              ))}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Button asChild size="lg" className="min-h-11 w-full bg-[#d1aa58] text-black hover:bg-[#e1c47d]">
                <Link href="/orders/create">
                  立即下单
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-11 w-full border-[#c8a45d]/30 bg-white/[0.03]">
                <Link href="/chat">
                  联系客服
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-11 w-full border-white/15 bg-white/[0.03]">
                <Link href="/join">
                  申请成为护航师
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <HomeLivePanel />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-5">
            <div className="border-b border-white/10 pb-4">
              <p className="text-sm text-[#e1c47d]">当前可下单服务</p>
              <p className="mt-2 text-2xl font-bold">按目标选择护航类型</p>
            </div>
            <div className="mt-4 grid gap-3">
              {servicePackages.map((item) => (
                <div key={item.name} className="rounded-md border border-white/10 bg-black/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">{item.desc}</p>
                    </div>
                    <span className="shrink-0 rounded-sm border border-[#c8a45d]/30 px-2 py-1 text-xs text-[#e1c47d]">{item.tag}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-sm text-zinc-500">参考起步价</span>
                    <span className="text-lg font-bold text-[#e1c47d]">{formatMoney(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
              不确定服务类型时，先联系客服确认需求，避免选错套餐。
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#e1c47d]">交易保障</p>
          <h2 className="mt-2 text-3xl font-bold">下单前先把风险说清楚</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {guarantees.map((item) => (
            <Card key={item.title} className="border-white/10 bg-white/[0.045] backdrop-blur-xl">
              <CardContent className="p-5">
                <item.icon className="h-6 w-6 text-[#e1c47d]" aria-hidden="true" />
                <h3 className="mt-4 font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/25">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="mb-6">
            <p className="text-sm font-medium text-[#e1c47d]">真实评价</p>
            <h2 className="mt-2 text-3xl font-bold">玩家更关心服务是否稳定、沟通是否清楚</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {userReviews.map((review) => (
              <Card key={review.name} className="border-white/10 bg-white/[0.045] backdrop-blur-xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-1 text-[#e1c47d]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-300">{review.text}</p>
                  <div className="mt-5 border-t border-white/10 pt-4 text-sm text-zinc-500">
                    {review.name} · {review.service}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:py-14 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.045] backdrop-blur-xl lg:col-span-2">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-3">
              <Siren className="h-6 w-6 text-[#e1c47d]" aria-hidden="true" />
              <h2 className="text-2xl font-bold">平台规则</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-zinc-300 md:grid-cols-2">
              {platformRules.map((rule) => (
                <p key={rule}>{rule}</p>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#c8a45d]/20 bg-[#c8a45d]/10 backdrop-blur-xl">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-3">
              <MessageSquareWarning className="h-6 w-6 text-[#e1c47d]" aria-hidden="true" />
              <h2 className="text-2xl font-bold">举报入口</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">遇到诱导私下转账、消极服务、辱骂、虚假资料等情况，可以提交举报。</p>
            <Button asChild className="mt-5 min-h-11 w-full bg-[#d1aa58] text-black hover:bg-[#e1c47d]">
              <Link href="/reports/create">提交举报</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <Card className="border-white/10 bg-white/[0.045] backdrop-blur-xl">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
            <div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-[#e1c47d]" aria-hidden="true" />
                <h2 className="text-2xl font-bold">退款说明</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">服务未开始且双方未确认，可联系客服协助取消；服务已开始后按沟通记录和完成情况处理。</p>
            </div>
            <Button asChild variant="outline" className="min-h-11 w-full md:w-auto">
              <Link href="/chat">
                <Clock className="h-4 w-4" aria-hidden="true" />
                联系客服
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12">
        <ContactServiceCard />
      </section>
    </div>
  );
}
