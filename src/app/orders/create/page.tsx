import { redirect } from "next/navigation";

type CreateOrderPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function CreateOrderPage({ searchParams }: CreateOrderPageProps) {
  const params = await searchParams;
  const escortId = getParam(params, "escortId");

  if (escortId) {
    redirect(`/orders/new?escortId=${encodeURIComponent(escortId)}`);
  }

  redirect("/escorts");
}
