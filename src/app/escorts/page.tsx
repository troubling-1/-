import { Search } from "lucide-react";
import { EscortCard } from "@/components/site/escort-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { escorts } from "@/lib/mock-data";

export default function EscortsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">护航师列表</h1>
        <p className="mt-2 text-sm text-muted-foreground">支持按价格、KD、段位、在线状态搜索筛选。</p>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>筛选</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="搜索昵称、段位或简介" />
          </div>
          <Select defaultValue="">
            <option value="">全部价格</option>
            <option value="0-50">50 以下</option>
            <option value="50-100">50 到 100</option>
            <option value="100+">100 以上</option>
          </Select>
          <Select defaultValue="">
            <option value="">全部段位</option>
            <option value="ace">王牌</option>
            <option value="diamond">钻石</option>
            <option value="platinum">铂金</option>
          </Select>
          <Button>应用筛选</Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {escorts.map((escort) => (
          <EscortCard key={escort.id} escort={escort} />
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-2">
        <Button variant="outline">上一页</Button>
        <Button variant="secondary">第 1 页</Button>
        <Button variant="outline">下一页</Button>
      </div>
    </div>
  );
}
