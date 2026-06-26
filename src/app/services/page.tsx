import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { services } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "服务介绍",
  description:
    "三角洲行动护航服务介绍，包含带撤离、战备物资护送、上分护航、娱乐陪玩和下单前注意事项。",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "三角洲行动护航服务介绍 | Delta Escort",
    description: "了解带撤离、物资护送、上分护航、娱乐陪玩等服务区别和参考价格。",
    url: "/services",
    type: "article",
  },
};

const serviceDetails: Record<string, string> = {
  escort: "适合需要护航师陪打、任务协助和稳定沟通的玩家。",
  evacuation: "适合目标是稳定撤离、降低掉装风险、提高出图成功率的玩家。",
  materials: "适合高价值物资局，优先关注路线安全、背包保护和撤离节奏。",
  rank: "适合排位上分、练枪配合、团队节奏沟通和打法复盘。",
  fun: "适合休闲娱乐、熟悉地图、放松陪玩和新手基础沟通。",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="max-w-3xl">
        <p className="text-sm text-primary">服务介绍</p>
        <h1 className="mt-2 text-3xl font-bold">三角洲行动护航服务</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          你可以按目标选择服务：想稳定撤离选带撤离，背包价值高选物资护送，想上分选上分护航，只想轻松玩可以选娱乐陪玩。
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.value}>
            <CardContent className="p-5">
              <h2 className="font-bold">{service.label}</h2>
              <p className="mt-2 text-2xl font-black text-primary">{formatMoney(service.price)}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{serviceDetails[service.value]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-border bg-muted p-5 text-sm leading-6 text-muted-foreground">
        下单前建议先确认区服、时间、语音方式和服务目标。高价值物资局建议优先选择认证护航师，并保留平台订单记录。
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-11">
          <Link href="/orders/create">选择服务下单</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/escorts">查看护航师</Link>
        </Button>
      </div>
    </div>
  );
}
