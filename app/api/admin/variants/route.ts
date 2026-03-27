import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.productVariant.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await prisma.productVariant.create({
    data: {
      productId: body.productId,
      sku: `V-${Date.now()}`,
      color: body.color,
      size: body.size,
      shape: body.shape,
      purchasePrice: body.purchasePrice,
      sellingPrice: body.sellingPrice,
      stockQty: body.stockQty,
    },
  });
  await prisma.inventoryMovement.create({
    data: { variantId: created.id, type: "IN", quantity: Number(body.stockQty), note: "Initial stock" },
  });
  return NextResponse.json({ data: created });
}
