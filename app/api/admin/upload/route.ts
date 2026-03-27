import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extension = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
  const relativeDir = path.join("uploads", "products");
  const targetDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, fileName), buffer);

  return NextResponse.json({ url: `/${relativeDir.replace(/\\/g, "/")}/${fileName}` });
}
