import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const data = await prisma.productVariant.update({
    where: { id },
    data: { color: body.color, size: body.size, shape: body.shape, purchasePrice: body.purchasePrice, sellingPrice: body.sellingPrice, stockQty: body.stockQty },
  });
  return NextResponse.json({ data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.productVariant.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
