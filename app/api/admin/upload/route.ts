import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      { error: "إعدادات Cloudinary غير موجودة (CLOUDINARY_CLOUD_NAME/CLOUDINARY_UPLOAD_PRESET)" },
      { status: 500 },
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", "ksebstor/products");

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    {
      method: "POST",
      body: form,
      cache: "no-store",
    },
  );

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    return NextResponse.json({ error: `فشل رفع الصورة إلى Cloudinary: ${message}` }, { status: 500 });
  }

  const result = (await uploadResponse.json()) as { secure_url?: string; url?: string };
  const url = result.secure_url ?? result.url;
  if (!url) {
    return NextResponse.json({ error: "Cloudinary لم يرجع رابط الصورة" }, { status: 500 });
  }

  return NextResponse.json({ url });
}
