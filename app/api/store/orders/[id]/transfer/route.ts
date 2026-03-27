import { prisma } from "@/lib/prisma";
import { StoreOrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";

function createMainOrderId(storeOrderId: string) {
  return `MAIN-${storeOrderId.slice(-8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.storeOrder.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (order.status === StoreOrderStatus.TRANSFERRED_TO_MAIN) {
    return NextResponse.json({ order });
  }

  const updated = await prisma.storeOrder.update({
    where: { id },
    data: { status: StoreOrderStatus.TRANSFERRED_TO_MAIN, mainOrderId: createMainOrderId(id) },
  });

  return NextResponse.json({ order: updated });
}
