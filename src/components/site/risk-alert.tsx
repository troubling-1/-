import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function RiskAlert() {
  return (
    <Card className="border-emerald-300/20 bg-black/35">
      <CardContent className="p-4 text-sm leading-6 text-muted-foreground">
        <div className="flex gap-3">
          <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
          <div>
            <p className="font-medium text-foreground">交易风控提醒</p>
            <p className="mt-1">请勿私下交易，请勿提前转账给个人。平台仅保障站内订单，如遇异常请及时举报或联系客服。</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
