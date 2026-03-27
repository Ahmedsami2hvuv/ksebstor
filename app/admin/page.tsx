"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

type Basic = { id: string; name: string };
type Product = { id: string; name: string };
type Order = { id: string; customerName: string; status: string; totalAmount: string; mainOrderId: string | null };

export default function AdminPage() {
  const [categories, setCategories] = useState<Basic[]>([]);
  const [branches, setBranches] = useState<Basic[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState({ inventoryValue: 0, sales: 0, grossProfit: 0, ordersCount: 0, variantsCount: 0 });
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  async function load() {
    const [c, b, p, r] = await Promise.all([
      fetch("/api/admin/categories").then((x) => x.json()),
      fetch("/api/admin/branches").then((x) => x.json()),
      fetch("/api/admin/products").then((x) => x.json()),
      fetch("/api/admin/reports").then((x) => x.json()),
    ]);
    setCategories(c.data ?? []);
    setBranches(b.data ?? []);
    setProducts(p.data ?? []);
    const ordersData = await fetch("/api/admin/store-orders").then((x) => x.json()).catch(() => ({ data: [] }));
    setOrders(ordersData.data ?? []);
    setReports(r.data ?? reports);
  }

  useEffect(() => {
    load();
  }, []);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await fetch("/api/admin/upload", { method: "POST", body: formData }).then((r) => r.json());
      urls.push(result.url);
    }
    setImageUrls(urls);
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6">
      <h1 className="text-2xl font-black">لوحة الإدارة</h1>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card title="قيمة المخزون" value={formatCurrency(reports.inventoryValue)} />
        <Card title="المبيعات" value={formatCurrency(reports.sales)} />
        <Card title="الربح الإجمالي" value={formatCurrency(reports.grossProfit)} />
        <Card title="عدد الطلبات" value={String(reports.ordersCount)} />
        <Card title="عدد المتغيرات" value={String(reports.variantsCount)} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), parentId: fd.get("parentId") || null }) });
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة قسم</h2>
          <input name="name" placeholder="اسم القسم" required />
          <select name="parentId"><option value="">بدون أب</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <button className="mt-2 bg-indigo-600 text-white">حفظ</button>
        </form>

        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/branches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: fd.get("name"), parentId: fd.get("parentId") || null }) });
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة فرع</h2>
          <input name="name" placeholder="اسم الفرع" required />
          <select name="parentId"><option value="">بدون أب</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <button className="mt-2 bg-indigo-600 text-white">حفظ</button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: fd.get("name"), description: fd.get("description"), categoryId: fd.get("categoryId"), branchId: fd.get("branchId"), images: imageUrls }),
          });
          setImageUrls([]);
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة منتج</h2>
          <input name="name" placeholder="اسم المنتج" required />
          <textarea name="description" placeholder="وصف المنتج" required />
          <select name="categoryId" required>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select name="branchId" required>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <label className="mt-2 block text-xs text-slate-600">رفع صور من الجهاز</label>
          <input type="file" multiple accept="image/*" onChange={(e) => uploadFiles(e.target.files)} />
          <p className="mt-1 text-xs text-slate-500">عدد الصور المرفوعة: {imageUrls.length}</p>
          <button className="mt-2 bg-indigo-600 text-white">حفظ المنتج</button>
        </form>

        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/variants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: fd.get("productId"),
              color: fd.get("color"),
              size: fd.get("size"),
              shape: fd.get("shape"),
              purchasePrice: Number(fd.get("purchasePrice")),
              sellingPrice: Number(fd.get("sellingPrice")),
              stockQty: Number(fd.get("stockQty")),
            }),
          });
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة متغير</h2>
          <select name="productId" required>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input name="color" placeholder="اللون" required />
          <input name="size" placeholder="القياس" required />
          <input name="shape" placeholder="الشكل" required />
          <input name="purchasePrice" type="number" placeholder="سعر الشراء" required />
          <input name="sellingPrice" type="number" placeholder="سعر البيع" required />
          <input name="stockQty" type="number" placeholder="الكمية" required />
          <button className="mt-2 bg-indigo-600 text-white">حفظ المتغير</button>
        </form>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-extrabold">طلبات المتجر وتحويلها للنظام الأساسي</h2>
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-bold">{order.customerName}</p>
                <p className="text-xs text-slate-500">{order.status} - {formatCurrency(Number(order.totalAmount))}</p>
                {order.mainOrderId && <p className="text-xs text-emerald-700">MainOrderId: {order.mainOrderId}</p>}
              </div>
              <button className="bg-emerald-600 text-white" onClick={async () => {
                await fetch(`/api/store/orders/${order.id}/transfer`, { method: "POST" });
                await load();
              }}>
                تحويل للنظام الأساسي
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
