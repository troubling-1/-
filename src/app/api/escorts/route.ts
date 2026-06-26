export const runtime = "edge";

import { NextResponse } from "next/server";
import { escorts } from "@/lib/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ data: escorts, source: "mock" });
    }

    const { data, error } = await supabase
      .from("escorts")
      .select("*")
      .eq("approved", true)
      .order("online_status", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, source: "supabase" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "查询护航师失败" }, { status: 500 });
  }
}
