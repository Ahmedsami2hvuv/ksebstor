"use client";

import { useState } from "react";

type CartLine = { variantId: string; quantity: number; title: string };

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage("");
    const items = JSON.parse(localStorage.getItem("kseb_cart") ?? "[]") as CartLine[];
    const payload = {
      customerName: String(formData.get("customerName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    };
    const response = await fetch("/api/store/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "حدث خطأ أثناء إنشاء الطلب");
      setLoading(false);
      return;
    }
    localStorage.removeItem("kseb_cart");
    setMessage(`تم إنشاء الطلب بنجاح: ${data.order.id}`);
    setLoading(false);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-black">Checkout بدون تسجيل</h1>
      <form action={onSubmit} className="mt-4 space-y-3 rounded-2xl border bg-white p-4">
        <input name="customerName" placeholder="الاسم الكامل" required />
        <input name="phone" placeholder="رقم الهاتف" required />
        <input name="city" placeholder="المدينة" required />
        <textarea name="address" placeholder="العنوان التفصيلي" required />
        <textarea name="notes" placeholder="ملاحظات (اختياري)" />
        <button disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "جاري إنشاء الطلب..." : "تأكيد الطلب"}
        </button>
      </form>
      {message && <p className="mt-3 rounded-xl bg-slate-100 p-3 text-sm">{message}</p>}
    </main>
  );
}
