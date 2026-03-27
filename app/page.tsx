import Link from "next/link";
import { getStoreHomeData } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import SearchBox from "@/components/search-box";
import { normalizeImageUrl } from "@/lib/image-url";
import AddToCartButton from "@/components/add-to-cart-button";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { categories, products } = await getStoreHomeData(q);
  const tree = buildCategoryTree(categories);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 py-5">
      <aside className="sticky top-24 h-fit w-64 rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-base font-extrabold">الأقسام</h3>
        <div className="space-y-1 text-sm">{tree.map((node) => <CategoryNode key={node.id} node={node} level={0} />)}</div>
      </aside>
      <section className="flex-1 space-y-4">
        <SearchBox />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="rounded-2xl border bg-white p-3">
              <div className="mb-2 h-44 overflow-hidden rounded-xl border bg-slate-100">
                <img
                  src={normalizeImageUrl(product.images[0]?.url)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="font-bold">{product.name}</h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
              <p className="mt-2 text-sm font-black text-indigo-700">
                {formatCurrency(Number(product.variants[0]?.sellingPrice ?? 0))}
              </p>
              {product.variants[0] ? (
                <div className="mt-2">
                  <AddToCartButton variantId={product.variants[0].id} title={product.name} />
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

type Cat = { id: string; name: string; parentId: string | null };
type CatNode = Cat & { children: CatNode[] };

function buildCategoryTree(categories: Cat[]) {
  const map = new Map<string, CatNode>();
  for (const c of categories) map.set(c.id, { ...c, children: [] });
  const roots: CatNode[] = [];
  for (const c of categories) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function CategoryNode({ node, level }: { node: CatNode; level: number }) {
  return (
    <div>
      <div className="rounded-lg bg-slate-50 p-2" style={{ marginRight: `${level * 14}px` }}>
        {node.name}
      </div>
      {node.children.map((child) => (
        <CategoryNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
}
