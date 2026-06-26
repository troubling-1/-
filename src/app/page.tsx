import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Crosshair, Shield, Star, Trophy } from "lucide-react";
import { HomeLivePanel } from "@/components/site/home-live-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { escorts } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

const servicePackages = [
  {
    name: "撤离护航",
    tag: "热门",
    price: 88,
    desc: "适合需要稳定撤离、任务路线和物资保护的玩家。",
    points: ["地图路线规划", "撤离点判断", "战备物资保护"],
  },
  {
    name: "战备物资护送",
    tag: "高价值",
    price: 108,
    desc: "针对高价值物资局，优先降低掉装风险。",
    points: ["进出点位规划", "遭遇战协同", "背包价值保护"],
  },
  {
    name: "上分陪玩",
    tag: "稳定",
    price: 58,
    desc: "适合排位上分、练枪和团队沟通磨合。",
    points: ["段位节奏控制", "枪线配合", "复盘建议"],
  },
];

const advantages = [
  { icon: Shield, title: "资料审核", text: "护航师资料、段位、价格和服务说明统一进入后台审核。" },
  { icon: Clock, title: "订单流转", text: "待接单、已接单、进行中、已完成、已取消状态清晰可查。" },
  { icon: Trophy, title: "评价沉淀", text: "完成订单后可评价，帮助玩家判断护航师真实服务质量。" },
  { icon: Crosshair, title: "异常举报", text: "订单或护航师异常可提交举报，由后台统一处理。" },
];

export default function HomePage() {
  return (
    <div className="bg-[#080a0d] text-foreground">
      <section className="relative overflow-hidden border-b border-[#c8a45d]/15 bg-[#07080a]">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(200,164,93,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(200,164,93,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute left-1/2 top-0 h-px w-[78%] -translate-x-1/2 bg-[#c8a45d]/50" />
        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-4 py-12 md:py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <Badge className="border-[#c8a45d]/40 bg-[#c8a45d]/10 text-[#e1c47d]">Delta Force Escort Platform</Badge>
            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              三角洲行动
              <span className="block text-[#e1c47d]">高端护航接单平台</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
              面向玩家、护航师与平台管理员的护航服务系统，覆盖带撤离、战备物资护送、上分陪玩、娱乐陪玩与订单风控。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-[#d1aa58] text-black hover:bg-[#e1c47d]">
                <Link href="/orders/create">
                  发布订单
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-[#c8a45d]/30 bg-white/[0.03]">
                <Link href="/escorts">浏览护航师</Link>
              </Button>
            </div>
            <HomeLivePanel />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-5">
            <div className="border-b border-white/10 pb-4">
              <p className="text-sm text-[#e1c47d]">Live Operations Board</p>
              <p className="mt-2 text-2xl font-bold">当前热门护航任务</p>
            </div>
            <div className="mt-4 grid gap-3">
              {servicePackages.map((item) => (
                <div key={item.name} className="rounded-md border border-white/10 bg-black/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
                    </div>
                    <span className="shrink-0 rounded-sm border border-[#c8a45d]/30 px-2 py-1 text-xs text-[#e1c47d]">{item.tag}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-sm text-zinc-500">起步价</span>
                    <span className="text-lg font-bold text-[#e1c47d]">{formatMoney(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-[#e1c47d]">Selected Escorts</p>
            <h2 className="mt-2 text-3xl font-bold">精选护航师卡片墙</h2>
          </div>
          <Button asChild variant="outline" className="w-full border-[#c8a45d]/30 bg-white/[0.03] md:w-auto">
            <Link href="/escorts">查看全部</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {escorts.map((escort, index) => (
            <Card key={escort.id} className="border-white/10 bg-white/[0.045] backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold">{escort.nickname}</p>
                    <p className="mt-1 text-sm text-zinc-400">{escort.rank}</p>
                  </div>
                  <span className="rounded-sm border border-[#c8a45d]/30 px-2 py-1 text-xs text-[#e1c47d]">#{index + 1}</span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-400">{escort.bio}</p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-md bg-black/35 p-3">
                    <p className="text-zinc-500">KD</p>
                    <p className="mt-1 font-semibold">{escort.kd.toFixed(1)}</p>
                  </div>
                  <div className="rounded-md bg-black/35 p-3">
                    <p className="text-zinc-500">价格</p>
                    <p className="mt-1 font-semibold">{formatMoney(escort.price)}</p>
                  </div>
                  <div className="rounded-md bg-black/35 p-3">
                    <p className="text-zinc-500">评分</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold">
                      <Star className="h-4 w-4 text-[#e1c47d]" aria-hidden="true" />
                      5.0
                    </p>
                  </div>
                </div>
                <Button asChild className="mt-5 w-full bg-[#d1aa58] text-black hover:bg-[#e1c47d]">
                  <Link href={`/escorts/${escort.id}`}>查看详情</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/25">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <div className="mb-6">
            <p className="text-sm font-medium text-[#e1c47d]">Service Packages</p>
            <h2 className="mt-2 text-3xl font-bold">服务套餐展示</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {servicePackages.map((item) => (
              <Card key={item.name} className="border-white/10 bg-white/[0.045] backdrop-blur-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{item.name}</h3>
                    <span className="text-2xl font-black text-[#e1c47d]">{formatMoney(item.price)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{item.desc}</p>
                  <div className="mt-5 grid gap-3">
                    {item.points.map((point) => (
                      <div key={point} className="flex items-center gap-2 text-sm text-zinc-300">
                        <CheckCircle2 className="h-4 w-4 text-[#e1c47d]" aria-hidden="true" />
                        {point}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-4 md:grid-cols-4">
          {advantages.map((item) => (
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
    </div>
  );
}
