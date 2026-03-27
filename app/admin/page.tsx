"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/image-url";

type Basic = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  branchId: string;
  isActive: boolean;
  images: { id: string; url: string }[];
  variants: { id: string; color: string; size: string; shape: string; purchasePrice: string; sellingPrice: string; stockQty: number }[];
};
type Order = { id: string; customerName: string; status: string; totalAmount: string; mainOrderId: string | null };
type Variant = { id: string; color: string; size: string; shape: string; stockQty: number; product: { name: string } };

export default function AdminPage() {
  const [categories, setCategories] = useState<Basic[]>([]);
  const [branches, setBranches] = useState<Basic[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [reports, setReports] = useState({ inventoryValue: 0, sales: 0, grossProfit: 0, ordersCount: 0, variantsCount: 0 });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editProductId, setEditProductId] = useState("");
  const [editProductImages, setEditProductImages] = useState<string[]>([]);

  async function load() {
    const [c, b, p, v, r] = await Promise.all([
      fetch("/api/admin/categories").then((x) => x.json()),
      fetch("/api/admin/branches").then((x) => x.json()),
      fetch("/api/admin/products").then((x) => x.json()),
      fetch("/api/admin/variants").then((x) => x.json()),
      fetch("/api/admin/reports").then((x) => x.json()),
    ]);
    setCategories(c.data ?? []);
    setBranches(b.data ?? []);
    setProducts(p.data ?? []);
    setVariants(v.data ?? []);
    const ordersData = await fetch("/api/admin/store-orders").then((x) => x.json()).catch(() => ({ data: [] }));
    setOrders(ordersData.data ?? []);
    setReports(r.data ?? reports);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedProduct = products.find((p) => p.id === editProductId);
  const selectedCategory = categories.find((c) => c.id === editCategoryId);
  const selectedBranch = branches.find((b) => b.id === editBranchId);

  useEffect(() => {
    if (selectedProduct) {
      setEditProductImages(selectedProduct.images.map((i) => i.url));
    } else {
      setEditProductImages([]);
    }
  }, [editProductId, selectedProduct]);

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
        <h2 className="mb-3 font-extrabold">تعديل شامل للأقسام والفروع</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold">تعديل قسم</p>
            <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
              <option value="">اختر قسم</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedCategory ? (
              <form className="mt-2 space-y-2" action={async (fd) => {
                await fetch(`/api/admin/categories/${selectedCategory.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: fd.get("name"), parentId: fd.get("parentId") || null }),
                });
                await load();
              }}>
                <input name="name" defaultValue={selectedCategory.name} placeholder="اسم القسم" />
                <select name="parentId" defaultValue="">
                  <option value="">بدون أب</option>
                  {categories.filter((c) => c.id !== selectedCategory.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button className="bg-amber-100 text-amber-800">حفظ تعديل</button>
                  <button type="button" className="bg-rose-100 text-rose-700" onClick={async () => {
                    if (!confirm("حذف القسم؟")) return;
                    await fetch(`/api/admin/categories/${selectedCategory.id}`, { method: "DELETE" });
                    setEditCategoryId("");
                    await load();
                  }}>حذف</button>
                </div>
              </form>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">تعديل فرع</p>
            <select value={editBranchId} onChange={(e) => setEditBranchId(e.target.value)}>
              <option value="">اختر فرع</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {selectedBranch ? (
              <form className="mt-2 space-y-2" action={async (fd) => {
                await fetch(`/api/admin/branches/${selectedBranch.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: fd.get("name"), parentId: fd.get("parentId") || null }),
                });
                await load();
              }}>
                <input name="name" defaultValue={selectedBranch.name} placeholder="اسم الفرع" />
                <select name="parentId" defaultValue="">
                  <option value="">بدون أب</option>
                  {branches.filter((b) => b.id !== selectedBranch.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button className="bg-amber-100 text-amber-800">حفظ تعديل</button>
                  <button type="button" className="bg-rose-100 text-rose-700" onClick={async () => {
                    if (!confirm("حذف الفرع؟")) return;
                    await fetch(`/api/admin/branches/${selectedBranch.id}`, { method: "DELETE" });
                    setEditBranchId("");
                    await load();
                  }}>حذف</button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-extrabold">تعديل شامل للمنتج (اسم + وصف + صور متعددة + متغيرات + أسعار)</h2>
        <select value={editProductId} onChange={(e) => setEditProductId(e.target.value)}>
          <option value="">اختر منتج</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selectedProduct ? (
          <div className="mt-3 space-y-4">
            <form className="space-y-2 rounded-xl border p-3" action={async (fd) => {
              await fetch(`/api/admin/products/${selectedProduct.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: fd.get("name"),
                  description: fd.get("description"),
                  categoryId: fd.get("categoryId"),
                  branchId: fd.get("branchId"),
                  isActive: fd.get("isActive") === "on",
                  images: editProductImages,
                }),
              });
              await load();
            }}>
              <input name="name" defaultValue={selectedProduct.name} placeholder="اسم المنتج" />
              <textarea name="description" defaultValue={selectedProduct.description} placeholder="وصف المنتج" />
              <select name="categoryId" defaultValue={selectedProduct.categoryId}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <select name="branchId" defaultValue={selectedProduct.branchId}>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={selectedProduct.isActive} className="h-4 w-4" />
                مفعل
              </label>
              <label className="text-xs text-slate-500">صور المنتج (متعددة)</label>
              <input type="file" multiple accept="image/*" onChange={async (e) => {
                const files = e.target.files;
                if (!files?.length) return;
                const uploaded: string[] = [];
                for (const file of Array.from(files)) {
                  const form = new FormData();
                  form.append("file", file);
                  const result = await fetch("/api/admin/upload", { method: "POST", body: form }).then((r) => r.json());
                  if (result.url) uploaded.push(result.url);
                }
                setEditProductImages((prev) => [...prev, ...uploaded]);
              }} />
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {editProductImages.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="rounded-lg border p-2">
                    <img src={normalizeImageUrl(url)} alt="product" className="h-20 w-full rounded object-cover" />
                    <button
                      type="button"
                      className="mt-1 w-full bg-rose-100 text-rose-700"
                      onClick={() => setEditProductImages((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      حذف الصورة
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="bg-indigo-600 text-white">حفظ كل تعديل المنتج</button>
                <button type="button" className="bg-rose-100 text-rose-700" onClick={async () => {
                  if (!confirm("حذف المنتج بالكامل؟")) return;
                  await fetch(`/api/admin/products/${selectedProduct.id}`, { method: "DELETE" });
                  setEditProductId("");
                  await load();
                }}>حذف المنتج</button>
              </div>
            </form>

            <div className="space-y-2 rounded-xl border p-3">
              <p className="font-bold">متغيرات المنتج وتعديل الأسعار/المخزون</p>
              {selectedProduct.variants.map((variant) => (
                <form key={variant.id} className="grid grid-cols-2 gap-2 rounded-lg border p-2 md:grid-cols-7" action={async (fd) => {
                  await fetch(`/api/admin/variants/${variant.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
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
                  <input name="color" defaultValue={variant.color} />
                  <input name="size" defaultValue={variant.size} />
                  <input name="shape" defaultValue={variant.shape} />
                  <input name="purchasePrice" type="number" defaultValue={Number(variant.purchasePrice)} />
                  <input name="sellingPrice" type="number" defaultValue={Number(variant.sellingPrice)} />
                  <input name="stockQty" type="number" defaultValue={variant.stockQty} />
                  <div className="flex gap-1">
                    <button className="bg-amber-100 text-amber-800">تحديث</button>
                    <button type="button" className="bg-rose-100 text-rose-700" onClick={async () => {
                      if (!confirm("حذف المتغير؟")) return;
                      await fetch(`/api/admin/variants/${variant.id}`, { method: "DELETE" });
                      await load();
                    }}>حذف</button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        ) : null}
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
