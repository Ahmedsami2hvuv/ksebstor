import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const images = Array.isArray(body.images) ? body.images.map((x: unknown) => String(x ?? "").trim()).filter(Boolean) : [];
  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.map((x: unknown) => String(x)) : [];
  const branchIds = Array.isArray(body.branchIds) ? body.branchIds.map((x: unknown) => String(x)) : [];
  const primaryCategoryId = String(body.categoryId || categoryIds[0] || "");
  const primaryBranchId = String(body.branchId || branchIds[0] || "");
  const data = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      categoryId: primaryCategoryId,
      branchId: primaryBranchId,
      isActive: body.isActive,
      images: {
        deleteMany: {},
        create: images.map((url: string, i: number) => ({ url, sortOrder: i })),
      },
      categories: {
        deleteMany: {},
        create: Array.from(new Set([primaryCategoryId, ...categoryIds].filter(Boolean))).map((categoryId) => ({ categoryId })),
      },
      branches: {
        deleteMany: {},
        create: Array.from(new Set([primaryBranchId, ...branchIds].filter(Boolean))).map((branchId) => ({ branchId })),
      },
    },
    include: { images: true, variants: true, category: true, branch: true, categories: true, branches: true },
  });
  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
