"use server";

import { prisma } from "@/lib/prisma";
import { StoreOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { transferOrderToMainSystem } from "@/lib/main-system";

export async function markOrderPreparing(orderId: string) {
  await prisma.storeOrder.update({
    where: { id: orderId },
    data: { status: StoreOrderStatus.PREPARING },
  });
  revalidatePath("/admin");
}

export async function markOrderReady(orderId: string) {
  await prisma.storeOrder.update({
    where: { id: orderId },
    data: { status: StoreOrderStatus.READY_FOR_TRANSFER },
  });
  revalidatePath("/admin");
}

export async function transferStoreOrderToMain(orderId: string) {
  const transferred = await transferOrderToMainSystem(orderId);
  await prisma.storeOrder.update({
    where: { id: orderId },
    data: { status: StoreOrderStatus.TRANSFERRED_TO_MAIN, mainOrderId: transferred.mainOrderId },
  });
  revalidatePath("/admin");
}
