import Link from "next/link";
import { Activity, ArrowRight, Headphones, Radio, ShieldCheck, Star, TrendingUp, UserCheck } from "lucide-react";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RiskAlert } from "@/components/site/risk-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hotEscorts, latestReviewFeed, platformStats, todayDeals } from "@/lib/operation-seed";
import { formatMoney } from "@/lib/utils";

const servicePackages = [
  { name: "带撤离护航", price: 88, desc: "适合稳定撤离、任务协助和降低掉装风险。", signal: "今日热度 96%" },
  { name: "物资护送", price: 108, desc: "适合高价值物资局，优先保障安全转点和顺利带出。", signal: "成交增长 32%" },
  { name: "上分护航", price: 58, desc: "适合排位上分、练枪配合、队伍沟通和节奏带动。", signal: "复购率 41%" },
];

export default function HomePage() {
  return (
    <div className="bg-[#070a09] text-foreground">
      <section className="relative overflow-hidden border-b border-emerald-300/10">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <Badge className="border-emerald-300/40 bg-emerald-300/10 text-emerald-200">三角洲行动护航平台</Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
              三角洲行动护航接单
              <span className="block text-emerald-300">带撤离、护物资、陪上分</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
              认证护航师在线接单，订单、评价、举报和售后记录都在站内留痕。先看数据，再选择合适的护航师。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroStat label="今日成交" value={`${platformStats.todayOrders} 单`} />
              <HeroStat label="在线护航师" value={`${platformStats.onlineEscorts} 位`} />
              <HeroStat label="好评率" value={`${platformStats.positiveRate}%`} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Button asChild size="lg" className="min-h-11 w-full">
                <Link href="/escorts">
                  选择护航师
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-11 w-full">
                <Link href="/chat">
                  联系客服
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-11 w-full">
                <Link href="/join">
                  成为护航师
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm text-emerald-300">实时成交</p>
                    <p className="mt-1 text-2xl font-bold">今日订单滚动</p>
                  </div>
                  <Radio className="h-6 w-6 text-emerald-300" aria-hidden="true" />
                </div>
                <div className="mt-4 grid gap-3">
                  {todayDeals.map((deal) => (
                    <div key={deal.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-white/10 bg-black/35 p-3 text-sm">
                      <div>
                        <p className="font-medium">{deal.user} 下单 {deal.service}</p>
                        <p className="mt-1 text-muted-foreground">{deal.escort} / {deal.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-300">{formatMoney(deal.amount)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{deal.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-300">运营数据</p>
            <h2 className="mt-2 text-3xl font-bold">平台正在稳定成交</h2>
          </div>
          <Badge tone="success">数据每 5 分钟刷新</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <OperationCard icon={Activity} label="累计完成订单" value={`${platformStats.completedOrders}`} text="站内可追溯服务记录" />
          <OperationCard icon={TrendingUp} label="今日成交额" value={formatMoney(platformStats.todayAmount)} text="不含未完成订单" />
          <OperationCard icon={ShieldCheck} label="售后解决率" value={`${platformStats.afterSaleSolvedRate}%`} text="举报和申诉处理口径" />
          <OperationCard icon={Headphones} label="平均响应" value={`${platformStats.averageResponseMinutes} 分钟`} text="客服与护航师综合响应" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:pb-14">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-300">热门护航师</p>
            <h2 className="mt-2 text-3xl font-bold">优先展示近期高成交护航师</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/escorts">查看全部护航师</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {hotEscorts.map((escort) => (
            <Card key={escort.id} className="border-white/10 bg-white/[0.045]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-emerald-300">热榜 #{escort.heatRank}</p>
                    <h3 className="mt-1 font-bold">{escort.nickname}</h3>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{escort.rank} / KD {Number(escort.kd || 0).toFixed(1)}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <MiniMetric label="今日接单" value={`${escort.todayOrders}`} />
                  <MiniMetric label="好评率" value={`${escort.positive_rate || 98}%`} />
                </div>
                <Button asChild className="mt-5 w-full">
                  <Link href={`/escorts/${escort.id}`}>查看详情</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/25">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="mb-6">
            <p className="text-sm font-medium text-emerald-300">最新评价</p>
            <h2 className="mt-2 text-3xl font-bold">真实服务反馈持续沉淀</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {latestReviewFeed.map((review) => (
              <Card key={review.id} className="border-white/10 bg-white/[0.045]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-1 text-emerald-300">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-zinc-300">{review.content}</p>
                  <p className="mt-4 border-t border-white/10 pt-3 text-xs text-muted-foreground">
                    {review.userName} / {review.escortName} / {review.serviceLabel}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:py-14 lg:grid-cols-[1fr_0.85fr]">
        <div className="grid content-start gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-300">服务类型</p>
            <h2 className="mt-2 text-3xl font-bold">按目标选择护航类型</h2>
          </div>
          <div className="grid gap-3">
            {servicePackages.map((item) => (
              <div key={item.name} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{item.desc}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-bold text-emerald-300">{formatMoney(item.price)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.signal}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-4">
          <RiskAlert />
          <ContactServiceCard compact />
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold text-emerald-200">{value}</p>
    </div>
  );
}

function OperationCard({ icon: Icon, label, value, text }: { icon: typeof Activity; label: string; value: string; text: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-emerald-300" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
