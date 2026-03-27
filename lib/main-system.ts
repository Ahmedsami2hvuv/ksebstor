import { prisma } from "@/lib/prisma";

type MainSystemPayload = {
  source: "ksebstor";
  storeOrderId: string;
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
  };
  totals: { totalAmount: number };
  items: Array<{
    variantId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    color: string;
    size: string;
    shape: string;
  }>;
};

function localMainOrderId(storeOrderId: string) {
  return `MAIN-${storeOrderId.slice(-8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}

export async function transferOrderToMainSystem(storeOrderId: string) {
  const order = await prisma.storeOrder.findUnique({
    where: { id: storeOrderId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!order) throw new Error("الطلب غير موجود");

  const payload: MainSystemPayload = {
    source: "ksebstor",
    storeOrderId: order.id,
    customer: {
      name: order.customerName,
      phone: order.phone,
      city: order.city,
      address: order.address,
      notes: order.notes ?? undefined,
    },
    totals: { totalAmount: Number(order.totalAmount) },
    items: order.items.map((item) => ({
      variantId: item.variantId,
      productName: item.variant.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      color: item.variant.color,
      size: item.variant.size,
      shape: item.variant.shape,
    })),
  };

  const endpoint = process.env.KSEB_MAIN_ORDER_API_URL?.trim();
  const token = process.env.KSEB_MAIN_ORDER_API_TOKEN?.trim();

  if (!endpoint) {
    return { mainOrderId: localMainOrderId(storeOrderId), mode: "local-fallback" as const };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Main system error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { mainOrderId?: string; orderNumber?: string; id?: string };
    const mainOrderId = data.mainOrderId ?? data.orderNumber ?? data.id ?? localMainOrderId(storeOrderId);
    return { mainOrderId, mode: "remote" as const };
  } finally {
    clearTimeout(timeout);
  }
}
