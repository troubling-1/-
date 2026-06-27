import { redirect } from "next/navigation";
import { AdminClientPage } from "./admin-client-page";
import { createServerSupabaseUserClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabaseUserClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const serviceSupabase = createServiceSupabaseClient();

  if (!serviceSupabase) {
    redirect("/403");
  }

  const { data: profile } = await serviceSupabase.from("users").select("role,status").eq("id", user.id).maybeSingle();

  if (!profile || profile.status !== "active" || profile.role !== "admin") {
    redirect("/403");
  }

  return <AdminClientPage />;
}
