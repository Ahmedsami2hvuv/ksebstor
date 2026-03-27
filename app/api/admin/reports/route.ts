import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const variants = await prisma.productVariant.findMany();
  const orders = await prisma.storeOrder.findMany({ include: { items: true } });

  const inventoryValue = variants.reduce((acc, v) => acc + Number(v.purchasePrice) * v.stockQty, 0);
  const sales = orders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const cogs = orders.reduce(
    (acc, o) =>
      acc +
      o.items.reduce((s, i) => {
        const variant = variants.find((v) => v.id === i.variantId);
        return s + (variant ? Number(variant.purchasePrice) * i.quantity : 0);
      }, 0),
    0,
  );

  return NextResponse.json({
    data: { inventoryValue, sales, grossProfit: sales - cogs, ordersCount: orders.length, variantsCount: variants.length },
  });
}
