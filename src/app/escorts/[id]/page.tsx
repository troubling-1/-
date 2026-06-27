import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, ShieldCheck, Star } from "lucide-react";
import { ContactServiceCard } from "@/components/site/contact-service-card";
import { RiskAlert } from "@/components/site/risk-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { escorts, reviews } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

type EscortDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EscortDetailPage({ params }: EscortDetailPageProps) {
  const { id } = await params;
  const escort = escorts.find((item) => item.id === id);

  if (!escort) {
    notFound();
  }

  const escortReviews = reviews.filter((review) => review.escort_id === escort.id);
  const averageRating = escortReviews.length
    ? escortReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / escortReviews.length
    : 0;
  const goodReviewCount = escortReviews.filter((review) => Number(review.rating || 0) >= 4).length;
  const goodRate = escortReviews.length ? Math.round((goodReviewCount / escortReviews.length) * 100) : escort.positive_rate || 98;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Card>
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={escort.online_status ? "success" : "muted"}>{escort.online_status ? "在线可接单" : "当前离线"}</Badge>
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  {escort.verified ? "平台认证" : "资料待完善"}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold">{escort.nickname}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{escort.bio || "该护航师暂未填写服务说明。"}</p>
              <p className="mt-2 text-xs text-muted-foreground">最近活跃：{escort.last_active_at || "今天"}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 md:min-w-80 md:grid-cols-1">
              <Button asChild size="lg" className="min-h-11 w-full">
                <Link href={`/orders/new?escortId=${escort.id}`}>立即下单</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-11 w-full">
                <Link href="/chat">
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                  联系客服
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-11 w-full">
                <Link href={`/reports/new?targetType=escort&targetId=${escort.id}`}>举报</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoItem label="段位" value={escort.rank || "未填写"} />
            <InfoItem label="KD" value={Number(escort.kd || 0).toFixed(1)} />
            <InfoItem label="价格" value={`${formatMoney(escort.price)}/局`} />
            <InfoItem label="平均评分" value={averageRating ? averageRating.toFixed(1) : "暂无"} withStar />
            <InfoItem label="成功订单" value={`${escort.order_count || 0} 单`} />
            <InfoItem label="好评率" value={`${goodRate}%`} />
            <InfoItem label="评价数量" value={`${escortReviews.length} 条`} />
            <InfoItem label="响应时间" value={escort.response_time || "5 分钟"} />
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <TagCard title="擅长模式" items={escort.special_modes || []} />
        <TagCard title="擅长地图" items={escort.special_maps || []} />
        <TagCard title="擅长玩法" items={escort.special_playstyles || []} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <InfoCard title="服务时间" text={escort.online_status ? "当前在线，可按订单沟通服务时间。" : "当前离线，请先下单或联系客服确认时间。"} />
        <InfoCard title="服务说明" text={escort.bio || "护航师暂未填写详细服务说明。"} />
        <InfoCard title="下单须知" text="请通过站内订单沟通需求，平台仅保障站内订单记录。" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <RiskAlert />
        <ContactServiceCard compact />
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">最近评价</h2>
        <div className="mt-4 grid gap-4">
          {escortReviews.length > 0 ? (
            escortReviews.slice(0, 5).map((review) => (
              <Card key={review.id}>
                <CardContent className="p-5">
                  <p className="text-primary">{"★".repeat(Math.max(1, Math.min(5, Number(review.rating || 0))))}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.content || "用户未填写文字评价。"}</p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href={`/reports/new?reviewId=${review.id}`}>举报该评价</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">暂无评价，完成订单后可查看用户反馈。</CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value, withStar = false }: { label: string; value: string; withStar?: boolean }) {
  return (
    <div className="rounded-md bg-muted p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-1 font-semibold">
        {withStar ? <Star className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : null}
        {value}
      </p>
    </div>
  );
}

function TagCard({ title, items }: { title: string; items: string[] }) {
  const displayItems = items.length > 0 ? items : ["暂未填写"];

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="font-bold">{title}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {displayItems.map((item) => (
            <span key={item} className="rounded-sm bg-muted px-2 py-1 text-sm text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="font-bold">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
