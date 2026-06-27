import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

const maxFileSize = 5 * 1024 * 1024;
const allowedImageTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择要上传的图片文件" }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "上传文件不能为空" }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
    }

    const fileExtension = allowedImageTypes[file.type];

    if (!fileExtension) {
      return NextResponse.json({ error: "仅支持 JPG、PNG、WebP 格式图片" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: "缺少 Supabase 服务端配置，无法上传图片" }, { status: 500 });
    }

    const filePath = `escort-profiles/${Date.now()}.${fileExtension}`;
    const { error } = await supabase.storage.from("uploads").upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: `图片上传失败：${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: { path: filePath } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "图片上传失败，请稍后重试" }, { status: 500 });
  }
}
