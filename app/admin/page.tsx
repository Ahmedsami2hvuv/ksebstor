"use client";

import { useEffect, useState } from "react";
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

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [catImageUrl, setCatImageUrl] = useState("");
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

  const catTree = buildTree(categories);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-6">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-extrabold">الأقسام</p>
            <button className="bg-indigo-600 text-white" onClick={() => setIsAddOpen((v) => !v)}>
              إضافة قسم
            </button>
          </div>

          {isAddOpen ? (
            <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
              <form
                className="space-y-2"
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
                <input name="sortOrder" type="number" placeholder="رقم القسم" defaultValue={0} />
                <input type="file" accept="image/*" onChange={(e) => uploadSingleImage(e.target.files, setCatImageUrl)} />
                {catImageUrl ? (
                  <img
                    src={normalizeImageUrl(catImageUrl)}
                    alt="category"
                    className="h-20 w-24 rounded-xl border object-cover"
                  />
                ) : null}
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
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            {catTree.length === 0 ? (
              <p className="text-xs text-slate-500">لا يوجد أقسام بعد.</p>
            ) : (
              catTree.map((node) => <CategoryRow key={node.id} node={node} level={0} onChanged={load} />)
            )}
          </div>
        </div>

        <Box title="الأفرع" />
        <Box title="المنتجات" />

        <Box title="الطلبات الجديدة" />
        <Box title="سجل الطلبات" />
        <Box title="الأرباح" />

        <Box title="حسابي" />
        <Box title="المستخدمين" />
      </section>
    </main>
  );
}

function Box({ title, className = "" }: { title: string; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${className}`}>
      <p className="text-sm font-extrabold">{title}</p>
      <p className="mt-1 text-xs text-slate-500">قريباً</p>
    </div>
  );
}

function CategoryRow({
  node,
  level,
  onChanged,
}: {
  node: CategoryNode;
  level: number;
  onChanged: () => Promise<void>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border bg-white p-2" style={{ marginRight: `${level * 12}px` }}>
        <img src={normalizeImageUrl(node.imageUrl)} alt={node.name} className="h-10 w-10 rounded-lg object-cover border" />
        <div className="flex-1">
          <p className="text-sm font-bold">{node.name}</p>
          <p className="text-xs text-slate-500">رقم: {node.sortOrder ?? 0}</p>
        </div>
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
      {node.children?.map((c) => <CategoryRow key={c.id} node={c} level={level + 1} onChanged={onChanged} />)}
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

