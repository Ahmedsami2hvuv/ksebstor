import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.product.findMany({
    include: { category: true, branch: true, categories: true, branches: true, images: true, variants: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds.map((x: unknown) => String(x)) : [];
  const branchIds = Array.isArray(body.branchIds) ? body.branchIds.map((x: unknown) => String(x)) : [];
  const primaryCategoryId = String(body.categoryId || categoryIds[0] || "");
  const primaryBranchId = String(body.branchId || branchIds[0] || "");
  const created = await prisma.product.create({
    data: {
      name: body.name,
      slug: toSlug(`${body.name}-${Date.now()}`),
      description: body.description,
      categoryId: primaryCategoryId,
      branchId: primaryBranchId,
      images: { create: (body.images || []).map((url: string, i: number) => ({ url, sortOrder: i })) },
      categories: {
        create: Array.from(new Set([primaryCategoryId, ...categoryIds].filter(Boolean))).map((categoryId) => ({ categoryId })),
      },
      branches: {
        create: Array.from(new Set([primaryBranchId, ...branchIds].filter(Boolean))).map((branchId) => ({ branchId })),
      },
    },
    include: { category: true, branch: true, categories: true, branches: true, images: true, variants: true },
  });
  return NextResponse.json({ data: created });
}
