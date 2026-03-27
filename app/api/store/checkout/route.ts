import { prisma } from "@/lib/prisma";
import { Prisma, StoreOrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(6),
  address: z.string().min(5),
  city: z.string().min(2),
  notes: z.string().optional(),
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) })).min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "مدخلات غير صحيحة" }, { status: 400 });
  }

  const ids = parsed.data.items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({ where: { id: { in: ids } } });
  const map = new Map(variants.map((v) => [v.id, v]));

  const orderItems = parsed.data.items.map((item) => {
    const variant = map.get(item.variantId);
    if (!variant) throw new Error(`Variant ${item.variantId} not found`);
    return {
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: variant.sellingPrice,
      totalPrice: variant.sellingPrice.mul(item.quantity),
    };
  });

  const totalAmount = orderItems.reduce((acc, i) => acc.add(i.totalPrice), new Prisma.Decimal(0));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.storeOrder.create({
      data: {
        customerName: parsed.data.customerName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        city: parsed.data.city,
        notes: parsed.data.notes,
        status: StoreOrderStatus.PENDING_PREPARATION,
        totalAmount,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    for (const item of parsed.data.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQty: { decrement: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: { variantId: item.variantId, quantity: item.quantity, type: "OUT", note: `StoreOrder ${created.id}` },
      });
    }
    return created;
  });

  return NextResponse.json({ order });
}
