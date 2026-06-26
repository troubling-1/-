import Link from "next/link";
import { Clock, Headphones, MessageCircle, QrCode, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ContactServiceCardProps = {
  compact?: boolean;
};

export function ContactServiceCard({ compact = false }: ContactServiceCardProps) {
  return (
    <Card className="border-[#c8a45d]/20 bg-[#c8a45d]/10">
      <CardContent className={compact ? "p-4" : "p-5 md:p-6"}>
        <div className="flex items-start gap-3">
          <Headphones className="mt-1 h-6 w-6 shrink-0 text-[#e1c47d]" aria-hidden="true" />
          <div>
            <h2 className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>联系客服</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              下单前不确定服务类型、价格或时间时，建议先联系平台客服确认。
            </p>
          </div>
        </div>

        <div className={compact ? "mt-4 grid gap-3" : "mt-5 grid gap-4 md:grid-cols-2"}>
          <QrPlaceholder title="微信客服二维码" text="请替换为真实微信客服图片" />
          <QrPlaceholder title="QQ群二维码" text="请替换为真实QQ群图片" />
        </div>

        <div className="mt-5 grid gap-3 text-sm leading-6 text-muted-foreground">
          <p className="flex gap-2">
            <Clock className="mt-1 h-4 w-4 shrink-0 text-[#e1c47d]" aria-hidden="true" />
            客服工作时间：每日 10:00 - 24:00
          </p>
          <p className="flex gap-2">
            <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-[#e1c47d]" aria-hidden="true" />
            下单后请保持微信、QQ或站内聊天可联系，客服会协助确认服务时间、区服和需求。
          </p>
          <p className="flex gap-2">
            <ShieldAlert className="mt-1 h-4 w-4 shrink-0 text-[#e1c47d]" aria-hidden="true" />
            请勿私下转账，避免订单售后无凭证。
          </p>
        </div>

        <Button asChild className="mt-5 min-h-11 w-full bg-[#d1aa58] text-black hover:bg-[#e1c47d]">
          <Link href="/chat">进入站内客服</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QrPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-4 text-center">
      <div className="mx-auto flex aspect-square w-32 max-w-full items-center justify-center rounded-md border border-dashed border-[#c8a45d]/40 bg-black/30">
        <QrCode className="h-10 w-10 text-[#e1c47d]" aria-hidden="true" />
      </div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
