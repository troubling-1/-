import { redirect } from "next/navigation";

type LegacyReportCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function LegacyReportCreatePage({ searchParams }: LegacyReportCreatePageProps) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
    } else if (value) {
      nextParams.set(key, value);
    }
  }

  const targetId = getParam(params, "targetId");
  const targetType = getParam(params, "targetType");

  if (targetType === "order" && targetId && !nextParams.get("orderId")) {
    nextParams.set("orderId", targetId);
  }

  redirect(`/reports/new?${nextParams.toString()}`);
}
