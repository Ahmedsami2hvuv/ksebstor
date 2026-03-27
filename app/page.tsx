import Link from "next/link";
import { getStoreHomeData } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import SearchBox from "@/components/search-box";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { categories, products } = await getStoreHomeData(q);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 px-4 py-5">
      <aside className="sticky top-24 h-fit w-64 rounded-2xl border bg-white p-4">
        <h3 className="mb-3 text-base font-extrabold">الأقسام</h3>
        <ul className="space-y-2 text-sm">
          {categories.map((c) => (
            <li key={c.id} className="rounded-lg bg-slate-50 p-2">
              {c.name}
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 space-y-4">
        <SearchBox />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="rounded-2xl border bg-white p-3">
              <div className="mb-2 h-44 rounded-xl bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${product.images[0]?.url ?? "/file.svg"})` }} />
              <h3 className="font-bold">{product.name}</h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
              <p className="mt-2 text-sm font-black text-indigo-700">
                {formatCurrency(Number(product.variants[0]?.sellingPrice ?? 0))}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
