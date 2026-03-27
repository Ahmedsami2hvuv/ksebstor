import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.product.findMany({
    include: { category: true, branch: true, images: true, variants: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.product.create({
    data: {
      name: body.name,
      slug: toSlug(`${body.name}-${Date.now()}`),
      description: body.description,
      categoryId: body.categoryId,
      branchId: body.branchId,
      images: { create: (body.images || []).map((url: string, i: number) => ({ url, sortOrder: i })) },
    },
  });
  return NextResponse.json({ data: created });
}
