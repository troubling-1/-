export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-black/30">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-muted-foreground md:grid-cols-3">
        <div>
          <p className="font-semibold text-foreground">Delta Escort</p>
          <p className="mt-2">三角洲行动护航陪玩接单平台。</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">服务</p>
          <p className="mt-2">护航、带撤离、物资护送、上分陪玩、娱乐陪玩。</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">合规提示</p>
          <p className="mt-2">平台只提供陪玩撮合与订单管理，不售卖游戏外挂或违规服务。</p>
        </div>
      </div>
    </footer>
  );
}
