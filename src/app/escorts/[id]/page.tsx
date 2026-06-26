export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const escortReviews = reviews.filter((review) => review.escort_id === escort.id || review.escort_id.startsWith("escort"));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <Badge tone={escort.online_status ? "success" : "muted"}>{escort.online_status ? "在线可接单" : "当前离线"}</Badge>
              <h1 className="mt-4 text-3xl font-bold">{escort.nickname}</h1>
              <p className="mt-2 text-muted-foreground">{escort.bio}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href={`/orders/create?escortId=${escort.id}`}>立即下单</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`/reports/create?targetType=escort&targetId=${escort.id}`}>举报</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">段位</p>
              <p className="mt-2 font-semibold">{escort.rank}</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">KD</p>
              <p className="mt-2 font-semibold">{escort.kd.toFixed(1)}</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">价格</p>
              <p className="mt-2 font-semibold">{formatMoney(escort.price)}/局</p>
            </div>
            <div className="rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">评价</p>
              <p className="mt-2 flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 text-amber-300" aria-hidden="true" />
                5.0
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">评价记录</h2>
        <div className="mt-4 grid gap-4">
          {escortReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-5">
                <p className="text-primary">{"★".repeat(review.rating)}</p>
                <p className="mt-3 text-sm text-muted-foreground">{review.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
