import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择上传文件" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件不能超过 5MB" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: "缺少 Supabase 服务端密钥，无法上传文件" }, { status: 500 });
    }

    const fileExt = file.name.split(".").pop() || "bin";
    const filePath = `escort-profiles/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from("uploads").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { path: filePath } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "上传失败" }, { status: 500 });
  }
}
