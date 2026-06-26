export const runtime = "edge";

import { NextResponse } from "next/server";
import { getAuthProfile } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const result = await getAuthProfile(request);

  if (result.error || !result.data) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ data: result.data.profile });
}
