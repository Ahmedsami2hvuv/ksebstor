import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  variantIds: z.array(z.string()).min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: parsed.data.variantIds } },
    include: { product: { include: { images: true } } },
  });

  return NextResponse.json({ variants });
}
