"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/image-url";

type Tab = "categories" | "branches" | "products" | "orders" | "employees";
type Basic = { id: string; name: string; parentId?: string | null; imageUrl?: string; notes?: string; sortOrder?: number };
type Product = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  branchId: string;
  isActive: boolean;
  categories: { categoryId: string }[];
  branches: { branchId: string }[];
  images: { id: string; url: string }[];
  variants: { id: string; color: string; size: string; shape: string; purchasePrice: string; sellingPrice: string; stockQty: number }[];
};
type Order = { id: string; customerName: string; status: string; totalAmount: string; mainOrderId: string | null };

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<Basic[]>([]);
  const [branches, setBranches] = useState<Basic[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState({ inventoryValue: 0, sales: 0, grossProfit: 0, ordersCount: 0, variantsCount: 0 });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [catImageUrl, setCatImageUrl] = useState("");
  const [branchImageUrl, setBranchImageUrl] = useState("");
  const [editCatImageUrl, setEditCatImageUrl] = useState("");
  const [editBranchImageUrl, setEditBranchImageUrl] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editBranchId, setEditBranchId] = useState<string>("");
  const [editProductId, setEditProductId] = useState("");
  const [editProductImages, setEditProductImages] = useState<string[]>([]);
  const [newProductCategoryIds, setNewProductCategoryIds] = useState<string[]>([]);
  const [newProductBranchIds, setNewProductBranchIds] = useState<string[]>([]);
  const [editProductCategoryIds, setEditProductCategoryIds] = useState<string[]>([]);
  const [editProductBranchIds, setEditProductBranchIds] = useState<string[]>([]);

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

  const selectedProduct = products.find((p) => p.id === editProductId);
  const selectedCategory = categories.find((c) => c.id === editCategoryId);
  const selectedBranch = branches.find((b) => b.id === editBranchId);

  useEffect(() => {
    if (selectedProduct) {
      setEditProductImages(selectedProduct.images.map((i) => i.url));
      setEditProductCategoryIds(selectedProduct.categories.map((c) => c.categoryId));
      setEditProductBranchIds(selectedProduct.branches.map((b) => b.branchId));
    } else {
      setEditProductImages([]);
      setEditProductCategoryIds([]);
      setEditProductBranchIds([]);
    }
  }, [editProductId, selectedProduct]);

  useEffect(() => {
    const cat = categories.find((x) => x.id === editCategoryId);
    setEditCatImageUrl(cat?.imageUrl ?? "");
  }, [editCategoryId, categories]);

  useEffect(() => {
    const br = branches.find((x) => x.id === editBranchId);
    setEditBranchImageUrl(br?.imageUrl ?? "");
  }, [editBranchId, branches]);

  async function uploadFiles(files: FileList | null, setter: (urls: string[]) => void, append = false) {
    if (!files?.length) return;
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await fetch("/api/admin/upload", { method: "POST", body: formData }).then((r) => r.json());
      urls.push(result.url);
    }
    setter(append ? [...(append ? [] : []), ...urls] : urls);
  }

  async function uploadSingleImage(files: FileList | null, setValue: (v: string) => void) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    const result = await fetch("/api/admin/upload", { method: "POST", body: formData }).then((r) => r.json());
    if (result.url) setValue(result.url);
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const branchOptions = branches.map((b) => ({ value: b.id, label: b.name }));

  function toggleMulti(current: string[], value: string) {
    return current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
  }

  const catTree = buildTree(categories);
  const branchTree = buildTree(branches);

  function renderNode(
    node: Basic & { children: (Basic & { children: Basic[] })[] },
    level: number,
    type: "cat" | "branch",
  ) {
    const isCat = type === "cat";
    return (
      <div key={node.id} className="space-y-1">
        <div className="flex items-center gap-2 rounded-xl border bg-white p-2" style={{ marginRight: `${level * 12}px` }}>
          <img src={normalizeImageUrl(node.imageUrl)} alt={node.name} className="h-10 w-10 rounded-lg object-cover border" />
          <div className="flex-1">
            <p className="text-sm font-bold">{node.name}</p>
            <p className="text-xs text-slate-500">تسلسل: {node.sortOrder ?? 0}</p>
          </div>
          <button
            className="bg-amber-100 text-amber-800"
            onClick={() => (isCat ? setEditCategoryId(node.id) : setEditBranchId(node.id))}
          >
            تعديل
          </button>
          <button
            className="bg-rose-100 text-rose-700"
            onClick={async () => {
              if (!confirm("تأكيد الحذف؟")) return;
              await fetch(isCat ? `/api/admin/categories/${node.id}` : `/api/admin/branches/${node.id}`, { method: "DELETE" });
              await load();
            }}
          >
            حذف
          </button>
        </div>
        {(node.children as (Basic & { children: Basic[] })[]).map((child) => renderNode(child as Basic & { children: (Basic & { children: Basic[] })[] }, level + 1, type))}
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6">
      <h1 className="text-2xl font-black">لوحة الإدارة</h1>
      <section className="flex flex-wrap gap-2">
        <TabBtn active={tab === "categories"} onClick={() => setTab("categories")} label="الأقسام" />
        <TabBtn active={tab === "branches"} onClick={() => setTab("branches")} label="الأفرع" />
        <TabBtn active={tab === "products"} onClick={() => setTab("products")} label="المنتجات" />
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} label="الطلبات" />
        <TabBtn active={tab === "employees"} onClick={() => setTab("employees")} label="الموظفين" />
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card title="قيمة المخزون" value={formatCurrency(reports.inventoryValue)} />
        <Card title="المبيعات" value={formatCurrency(reports.sales)} />
        <Card title="الربح الإجمالي" value={formatCurrency(reports.grossProfit)} />
        <Card title="عدد الطلبات" value={String(reports.ordersCount)} />
        <Card title="عدد المتغيرات" value={String(reports.variantsCount)} />
      </section>

      {tab === "categories" ? (
      <section className="grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              parentId: fd.get("parentId") || null,
              notes: fd.get("notes"),
              sortOrder: Number(fd.get("sortOrder") || 0),
              imageUrl: catImageUrl,
            }),
          });
          setCatImageUrl("");
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة قسم جديد</h2>
          <input name="name" placeholder="اسم القسم" required />
          <textarea name="notes" placeholder="ملاحظات تظهر مع القسم في المتجر" />
          <input name="sortOrder" type="number" placeholder="تسلسل القسم" defaultValue={0} />
          <select name="parentId"><option value="">بدون أب</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setCatImageUrl)} />
          {catImageUrl ? <img src={normalizeImageUrl(catImageUrl)} alt="cat" className="h-20 w-24 rounded border object-cover" /> : null}
          <button className="mt-2 bg-indigo-600 text-white">حفظ</button>
        </form>
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          if (!editCategoryId) return;
          await fetch(`/api/admin/categories/${editCategoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              parentId: fd.get("parentId") || null,
              notes: fd.get("notes"),
              sortOrder: Number(fd.get("sortOrder") || 0),
              imageUrl: editCatImageUrl,
            }),
          });
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">تعديل قسم</h2>
          <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
            <option value="">اختر قسم للتعديل</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCategory ? (
            <>
              <input name="name" defaultValue={selectedCategory.name} />
              <textarea name="notes" defaultValue={selectedCategory.notes ?? ""} />
              <input name="sortOrder" type="number" defaultValue={selectedCategory.sortOrder ?? 0} />
              <select name="parentId" defaultValue={selectedCategory.parentId ?? ""}>
                <option value="">بدون أب</option>
                {categories.filter((c) => c.id !== selectedCategory.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setEditCatImageUrl)} />
              {editCatImageUrl ? <img src={normalizeImageUrl(editCatImageUrl)} alt="cat" className="h-20 w-24 rounded border object-cover" /> : null}
              <button className="mt-2 bg-amber-500 text-white">تحديث</button>
            </>
          ) : null}
        </form>
        <div className="rounded-2xl border bg-slate-50 p-4 md:col-span-2">
          <h3 className="mb-3 font-extrabold">عرض عمودي للأقسام</h3>
          <div className="space-y-2">{catTree.map((node) => renderNode(node as Basic & { children: (Basic & { children: Basic[] })[] }, 0, "cat"))}</div>
        </div>
      </section>
      ) : null}

      {tab === "branches" ? (
      <section className="grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              parentId: fd.get("parentId") || null,
              notes: fd.get("notes"),
              sortOrder: Number(fd.get("sortOrder") || 0),
              imageUrl: branchImageUrl,
            }),
          });
          setBranchImageUrl("");
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة فرع جديد</h2>
          <input name="name" placeholder="اسم الفرع" required />
          <textarea name="notes" placeholder="ملاحظات الفرع" />
          <input name="sortOrder" type="number" defaultValue={0} placeholder="تسلسل الفرع" />
          <select name="parentId"><option value="">بدون أب</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setBranchImageUrl)} />
          {branchImageUrl ? <img src={normalizeImageUrl(branchImageUrl)} alt="branch" className="h-20 w-24 rounded border object-cover" /> : null}
          <button className="mt-2 bg-indigo-600 text-white">حفظ</button>
        </form>
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          if (!editBranchId) return;
          await fetch(`/api/admin/branches/${editBranchId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              parentId: fd.get("parentId") || null,
              notes: fd.get("notes"),
              sortOrder: Number(fd.get("sortOrder") || 0),
              imageUrl: editBranchImageUrl,
            }),
          });
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">تعديل فرع</h2>
          <select value={editBranchId} onChange={(e) => setEditBranchId(e.target.value)}>
            <option value="">اختر فرع للتعديل</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {selectedBranch ? (
            <>
              <input name="name" defaultValue={selectedBranch.name} />
              <textarea name="notes" defaultValue={selectedBranch.notes ?? ""} />
              <input name="sortOrder" type="number" defaultValue={selectedBranch.sortOrder ?? 0} />
              <select name="parentId" defaultValue={selectedBranch.parentId ?? ""}>
                <option value="">بدون أب</option>
                {branches.filter((b) => b.id !== selectedBranch.id).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setEditBranchImageUrl)} />
              {editBranchImageUrl ? <img src={normalizeImageUrl(editBranchImageUrl)} alt="branch" className="h-20 w-24 rounded border object-cover" /> : null}
              <button className="mt-2 bg-amber-500 text-white">تحديث</button>
            </>
          ) : null}
        </form>
        <div className="rounded-2xl border bg-slate-50 p-4 md:col-span-2">
          <h3 className="mb-3 font-extrabold">عرض عمودي للأفرع</h3>
          <div className="space-y-2">{branchTree.map((node) => renderNode(node as Basic & { children: (Basic & { children: Basic[] })[] }, 0, "branch"))}</div>
        </div>
      </section>
      ) : null}

      {tab === "products" ? (
      <section className="grid gap-4 md:grid-cols-2">
        <form className="rounded-2xl border bg-white p-4" action={async (fd) => {
          await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"),
              description: fd.get("description"),
              categoryId: newProductCategoryIds[0],
              branchId: newProductBranchIds[0],
              categoryIds: newProductCategoryIds,
              branchIds: newProductBranchIds,
              images: imageUrls,
            }),
          });
          setImageUrls([]);
          setNewProductCategoryIds([]);
          setNewProductBranchIds([]);
          await load();
        }}>
          <h2 className="mb-3 font-extrabold">إضافة منتج</h2>
          <input name="name" placeholder="اسم المنتج" required />
          <textarea name="description" placeholder="وصف المنتج" required />
          <label className="text-xs font-bold">انشر المنتج في أكثر من قسم</label>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-2">
            {categoryOptions.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newProductCategoryIds.includes(c.value)} onChange={() => setNewProductCategoryIds(toggleMulti(newProductCategoryIds, c.value))} className="h-4 w-4" />
                {c.label}
              </label>
            ))}
          </div>
          <label className="text-xs font-bold">انشر المنتج في أكثر من فرع</label>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-2">
            {branchOptions.map((b) => (
              <label key={b.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newProductBranchIds.includes(b.value)} onChange={() => setNewProductBranchIds(toggleMulti(newProductBranchIds, b.value))} className="h-4 w-4" />
                {b.label}
              </label>
            ))}
          </div>
          <label className="mt-2 block text-xs text-slate-600">رفع صور من الجهاز</label>
          <input type="file" multiple accept="image/*" onChange={(e) => uploadFiles(e.target.files, setImageUrls)} />
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
      ) : null}

      {tab === "products" ? (
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
                  categoryId: editProductCategoryIds[0],
                  branchId: editProductBranchIds[0],
                  categoryIds: editProductCategoryIds,
                  branchIds: editProductBranchIds,
                  isActive: fd.get("isActive") === "on",
                  images: editProductImages,
                }),
              });
              await load();
            }}>
              <input name="name" defaultValue={selectedProduct.name} placeholder="اسم المنتج" />
              <textarea name="description" defaultValue={selectedProduct.description} placeholder="وصف المنتج" />
              <label className="text-xs font-bold">الأقسام المنشور بها</label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-2">
                {categoryOptions.map((c) => (
                  <label key={c.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editProductCategoryIds.includes(c.value)} onChange={() => setEditProductCategoryIds(toggleMulti(editProductCategoryIds, c.value))} className="h-4 w-4" />
                    {c.label}
                  </label>
                ))}
              </div>
              <label className="text-xs font-bold">الأفرع المنشور بها</label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-2">
                {branchOptions.map((b) => (
                  <label key={b.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editProductBranchIds.includes(b.value)} onChange={() => setEditProductBranchIds(toggleMulti(editProductBranchIds, b.value))} className="h-4 w-4" />
                    {b.label}
                  </label>
                ))}
              </div>
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
      ) : null}

      {tab === "orders" ? (
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
      ) : null}

      {tab === "employees" ? (
      <section className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-extrabold">الموظفين</h2>
        <p className="text-sm text-slate-600">تم تجهيز خانة الموظفين حسب طلبك. إذا تريد أربطها بجدول موظفين فعلي في قاعدة البيانات أخليها CRUD كاملة بالدفعة الجاية.</p>
      </section>
      ) : null}
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

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={active ? "bg-indigo-600 text-white" : "bg-white border border-slate-300"}>
      {label}
    </button>
  );
}

function buildTree<T extends { id: string; parentId?: string | null }>(items: T[]) {
  const map = new Map<string, (T & { children: (T & { children: T[] })[] })>();
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));
  const roots: (T & { children: (T & { children: T[] })[] })[] = [];
  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) map.get(item.parentId)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}
