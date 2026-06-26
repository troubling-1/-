import Link from "next/link";
import { Radio, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import type { Escort } from "@/lib/types";

type EscortCardProps = {
  escort: Escort;
};

export function EscortCard({ escort }: EscortCardProps) {
  const tags = [...(escort.special_modes || []), ...(escort.special_maps || [])].slice(0, 4);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate">{escort.nickname}</CardTitle>
              {escort.verified ? (
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  已认证
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{escort.rank}</p>
          </div>
          <Badge tone={escort.online_status ? "success" : "muted"}>
            <Radio className="mr-1 h-3 w-3" aria-hidden="true" />
            {escort.online_status ? "在线" : "离线"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <InfoBox label="价格" value={`${formatMoney(escort.price)}/局`} />
          <InfoBox label="好评率" value={`${escort.positive_rate || 98}%`} />
          <InfoBox label="响应" value={escort.response_time || "5分钟"} />
          <InfoBox label="接单" value={`${escort.order_count || 0}单`} />
          <InfoBox label="KD" value={escort.kd.toFixed(1)} />
          <div className="rounded-md bg-muted p-3">
            <p className="text-muted-foreground">评分</p>
            <p className="mt-1 flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 text-amber-300" aria-hidden="true" />
              5.0
            </p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{escort.bio}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">最近活跃：{escort.last_active_at || "今天"}</p>

        <Button className="mt-5 min-h-11 w-full" asChild>
          <Link href={`/escorts/${escort.id}`}>查看详情</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
