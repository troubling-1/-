import Link from "next/link";
import { Radio, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import type { Escort } from "@/lib/types";

type EscortCardProps = {
  escort: Escort;
};

export function EscortCard({ escort }: EscortCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{escort.nickname}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{escort.rank}</p>
          </div>
          <Badge tone={escort.online_status ? "success" : "muted"}>
            <Radio className="mr-1 h-3 w-3" aria-hidden="true" />
            {escort.online_status ? "在线" : "离线"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-md bg-muted p-3">
            <p className="text-muted-foreground">KD</p>
            <p className="mt-1 font-semibold">{escort.kd.toFixed(1)}</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-muted-foreground">价格</p>
            <p className="mt-1 font-semibold">{formatMoney(escort.price)}/局</p>
          </div>
          <div className="rounded-md bg-muted p-3">
            <p className="text-muted-foreground">评分</p>
            <p className="mt-1 flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 text-amber-300" aria-hidden="true" />
              5.0
            </p>
          </div>
        </div>
        <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{escort.bio}</p>
        <Button className="mt-5 w-full" asChild>
          <Link href={`/escorts/${escort.id}`}>查看详情</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
