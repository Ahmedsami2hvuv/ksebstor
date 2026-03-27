"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { normalizeImageUrl } from "@/lib/image-url";

type Category = {
  id: string;
  name: string;
  parentId?: string | null;
  imageUrl?: string;
  notes?: string;
  sortOrder?: number;
  isActive?: boolean;
};

type CategoryNode = Category & { children: CategoryNode[] };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [catImageUrl, setCatImageUrl] = useState("");
  const [editId, setEditId] = useState<string>("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const c = await fetch("/api/admin/categories").then((x) => x.json());
    setCategories(c.data ?? []);
  }

  async function uploadSingleImage(files: FileList | null, setValue: (v: string) => void) {
    if (!files?.length) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    const result = await fetch("/api/admin/upload", { method: "POST", body: formData }).then((r) => r.json());
    if (result.url) setValue(result.url);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const name = String(c.name ?? "").toLowerCase();
      const notes = String(c.notes ?? "").toLowerCase();
      return name.includes(q) || notes.includes(q);
    });
  }, [categories, query]);

  const catTree = buildTree(filtered);
  const selected = categories.find((c) => c.id === editId);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">الأقسام</h1>
          <p className="mt-1 text-sm text-slate-600">قائمة الأقسام + بحث + إنشاء قسم</p>
        </div>
        <div className="flex gap-2">
          <Link className="bg-slate-200 text-slate-900" href="/admin">
            رجوع
          </Link>
          <button className="bg-indigo-600 text-white" onClick={() => setIsAddOpen((v) => !v)}>
            إنشاء قسم
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث داخل الأقسام..." />
      </div>

      {isAddOpen ? (
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-extrabold">إنشاء قسم</h2>
          <form
            className="mt-3 space-y-3"
            action={async (fd) => {
              setSaving(true);
              await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: fd.get("name"),
                  sortOrder: Number(fd.get("sortOrder") || 0),
                  imageUrl: catImageUrl,
                  notes: fd.get("notes"),
                  parentId: null,
                  isActive: true,
                }),
              });
              setCatImageUrl("");
              setIsAddOpen(false);
              await load();
              setSaving(false);
            }}
          >
            <input name="name" placeholder="اسم القسم" required />
            <input name="sortOrder" type="number" placeholder="تسلسل القسم" defaultValue={0} />
            <div>
              <label className="mb-1 block text-xs text-slate-600">صورة القسم</label>
              <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setCatImageUrl)} />
              {catImageUrl ? (
                <img src={normalizeImageUrl(catImageUrl)} alt="category" className="mt-2 h-24 w-28 rounded-xl border object-cover" />
              ) : null}
            </div>
            <textarea name="notes" placeholder="ملاحظات القسم" />
            <div className="flex gap-2">
              <button disabled={saving} className="bg-indigo-600 text-white disabled:opacity-60">
                {saving ? "جاري..." : "حفظ"}
              </button>
              <button
                type="button"
                className="bg-slate-200 text-slate-900"
                onClick={() => {
                  setIsAddOpen(false);
                  setCatImageUrl("");
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {selected ? (
        <section className="rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">تعديل قسم</h2>
            <button
              type="button"
              className="bg-slate-200 text-slate-900"
              onClick={() => {
                setEditId("");
                setEditImageUrl("");
              }}
            >
              إغلاق
            </button>
          </div>

          <form
            className="mt-3 space-y-3"
            action={async (fd) => {
              setSaving(true);
              await fetch(`/api/admin/categories/${selected.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: fd.get("name"),
                  parentId: selected.parentId ?? null,
                  notes: fd.get("notes"),
                  sortOrder: Number(fd.get("sortOrder") || 0),
                  imageUrl: editImageUrl || selected.imageUrl || "",
                  isActive: selected.isActive ?? true,
                }),
              });
              await load();
              setSaving(false);
            }}
          >
            <input name="name" placeholder="اسم القسم" defaultValue={selected.name} required />
            <input name="sortOrder" type="number" placeholder="تسلسل القسم" defaultValue={selected.sortOrder ?? 0} />
            <div>
              <label className="mb-1 block text-xs text-slate-600">صورة القسم</label>
              <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setEditImageUrl)} />
              <img
                src={normalizeImageUrl(editImageUrl || selected.imageUrl)}
                alt="category"
                className="mt-2 h-24 w-28 rounded-xl border object-cover"
              />
            </div>
            <textarea name="notes" placeholder="ملاحظات القسم" defaultValue={selected.notes ?? ""} />
            <button disabled={saving} className="bg-amber-500 text-white disabled:opacity-60">
              {saving ? "جاري..." : "تحديث"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-extrabold">القائمة</h2>
        <div className="mt-3 space-y-2">
          {catTree.length === 0 ? (
            <p className="text-sm text-slate-600">ماكو أقسام مطابقة للبحث.</p>
          ) : (
            catTree.map((node) => (
              <CategoryRow
                key={node.id}
                node={node}
                level={0}
                onChanged={load}
                onEdit={(id, imageUrl) => {
                  setEditId(id);
                  setEditImageUrl(imageUrl ?? "");
                  setIsAddOpen(false);
                }}
              />
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function CategoryRow({
  node,
  level,
  onChanged,
  onEdit,
}: {
  node: CategoryNode;
  level: number;
  onChanged: () => Promise<void>;
  onEdit: (id: string, imageUrl?: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border bg-white p-2" style={{ marginRight: `${level * 12}px` }}>
        <img src={normalizeImageUrl(node.imageUrl)} alt={node.name} className="h-10 w-10 rounded-lg object-cover border" />
        <div className="flex-1">
          <p className="text-sm font-bold">{node.name}</p>
          <p className="text-xs text-slate-500">تسلسل: {node.sortOrder ?? 0}</p>
        </div>
        <button className="bg-amber-100 text-amber-800" onClick={() => onEdit(node.id, node.imageUrl)}>
          تعديل
        </button>
        <button
          className="bg-slate-100 text-slate-800"
          onClick={async () => {
            await fetch(`/api/admin/categories/${node.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: node.name,
                parentId: node.parentId ?? null,
                notes: node.notes ?? "",
                sortOrder: node.sortOrder ?? 0,
                imageUrl: node.imageUrl ?? "",
                isActive: !node.isActive,
              }),
            });
            await onChanged();
          }}
        >
          {node.isActive ? "إخفاء" : "إظهار"}
        </button>
        <button
          className="bg-rose-100 text-rose-700"
          onClick={async () => {
            if (!confirm("حذف القسم؟")) return;
            await fetch(`/api/admin/categories/${node.id}`, { method: "DELETE" });
            await onChanged();
          }}
        >
          حذف
        </button>
      </div>
      {node.children?.map((c) => (
        <CategoryRow key={c.id} node={c} level={level + 1} onChanged={onChanged} onEdit={onEdit} />
      ))}
    </div>
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
  return roots as unknown as CategoryNode[];
}

