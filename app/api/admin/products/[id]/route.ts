import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const images = Array.isArray(body.images) ? body.images.map((x: unknown) => String(x ?? "").trim()).filter(Boolean) : [];
  const data = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      branchId: body.branchId,
      isActive: body.isActive,
      images: {
        deleteMany: {},
        create: images.map((url: string, i: number) => ({ url, sortOrder: i })),
      },
    },
    include: { images: true, variants: true, category: true, branch: true },
  });
  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
