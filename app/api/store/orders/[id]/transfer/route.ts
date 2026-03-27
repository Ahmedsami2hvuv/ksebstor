import { prisma } from "@/lib/prisma";
import { StoreOrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { transferOrderToMainSystem } from "@/lib/main-system";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.storeOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (order.status === StoreOrderStatus.TRANSFERRED_TO_MAIN) {
    return NextResponse.json({ order });
  }

  const transferred = await transferOrderToMainSystem(id);
  const updated = await prisma.storeOrder.update({
    where: { id },
    data: { status: StoreOrderStatus.TRANSFERRED_TO_MAIN, mainOrderId: transferred.mainOrderId },
  });

  return NextResponse.json({ order: updated, integrationMode: transferred.mode });
}
