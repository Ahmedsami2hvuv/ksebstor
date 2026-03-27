"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type CartLine = { variantId: string; quantity: number; title: string };
type VariantPayload = {
  id: string;
  sellingPrice: string;
  color: string;
  size: string;
  shape: string;
  product: { name: string };
};

export default function CartPage() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [variants, setVariants] = useState<VariantPayload[]>([]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("kseb_cart") ?? "[]") as CartLine[];
    setItems(cart);
    if (cart.length) {
      fetch("/api/store/cart/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantIds: cart.map((c) => c.variantId) }),
      })
        .then((r) => r.json())
        .then((d) => setVariants(d.variants ?? []));
    }
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const v = variants.find((x) => x.id === item.variantId);
      return sum + Number(v?.sellingPrice ?? 0) * item.quantity;
    }, 0);
  }, [items, variants]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-black">سلة التسوق</h1>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const v = variants.find((x) => x.id === item.variantId);
          return (
            <div key={item.variantId} className="rounded-xl border bg-white p-3">
              <p className="font-semibold">{v?.product.name ?? item.title}</p>
              <p className="text-xs text-slate-500">{v?.color} - {v?.size} - {v?.shape}</p>
              <p className="text-sm">الكمية: {item.quantity}</p>
              <p className="font-bold text-indigo-700">{formatCurrency(Number(v?.sellingPrice ?? 0) * item.quantity)}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-lg font-black">الإجمالي: {formatCurrency(total)}</p>
        <Link href="/checkout" className="mt-3 inline-block rounded-xl bg-indigo-500 px-4 py-2 font-semibold">
          متابعة الدفع كضيف
        </Link>
      </div>
    </main>
  );
}
