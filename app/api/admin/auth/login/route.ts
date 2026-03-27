import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  password: z.string().min(1),
  next: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "مدخلات غير صحيحة" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD غير مضبوط على السيرفر" },
      { status: 500 },
    );
  }

  if (parsed.data.password !== expected) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  }

  const redirectTo = parsed.data.next?.startsWith("/admin") ? parsed.data.next : "/admin";

  const res = NextResponse.json({ ok: true, redirectTo });
  res.cookies.set("ksebstor_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

