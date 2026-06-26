export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, ShieldCheck, Star } from "lucide-react";
import { ContactServiceCard } from "@/components/site/contact-service-card";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Card>
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={escort.online_status ? "success" : "muted"}>
                  {escort.online_status ? "在线可接单" : "当前离线"}
                </Badge>
                {escort.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    平台认证
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold">{escort.nickname}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{escort.bio}</p>
              <p className="mt-2 text-xs text-muted-foreground">最近活跃：{escort.last_active_at || "今天"}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 md:min-w-80 md:grid-cols-1">
              <Button asChild size="lg" className="min-h-11 w-full">
                <Link href={`/orders/create?escortId=${escort.id}`}>立即下单</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-11 w-full">
                <Link href="/chat">
                  <Headphones className="h-4 w-4" aria-hidden="true" />
                  联系客服
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-11 w-full">
                <Link href={`/reports/create?targetType=escort&targetId=${escort.id}`}>举报</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoItem label="段位" value={escort.rank} />
            <InfoItem label="KD" value={escort.kd.toFixed(1)} />
            <InfoItem label="价格" value={`${formatMoney(escort.price)}/局`} />
            <InfoItem label="评分" value="5.0" withStar />
            <InfoItem label="接单数量" value={`${escort.order_count || 0}单`} />
            <InfoItem label="好评率" value={`${escort.positive_rate || 98}%`} />
            <InfoItem label="响应时间" value={escort.response_time || "5分钟"} />
            <InfoItem label="在线状态" value={escort.online_status ? "在线" : "离线"} />
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <TagCard title="擅长模式" items={escort.special_modes || []} />
        <TagCard title="擅长地图" items={escort.special_maps || []} />
        <TagCard title="擅长玩法" items={escort.special_playstyles || []} />
      </section>

      <section className="mt-6">
        <ContactServiceCard compact />
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">评价记录</h2>
        <div className="mt-4 grid gap-4">
          {escortReviews.length > 0 ? (
            escortReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-5">
                  <p className="text-primary">{"★".repeat(review.rating)}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.content}</p>
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
        {withStar ? <Star className="h-4 w-4 text-amber-300" aria-hidden="true" /> : null}
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
