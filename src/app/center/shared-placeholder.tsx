import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CenterPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          <Button asChild className="mt-6">
            <Link href="/center">返回用户中心</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
