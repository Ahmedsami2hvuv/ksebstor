import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import AddToCartButton from "@/components/add-to-cart-button";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, variants: true, category: true, branch: true },
  });

  if (!product) return notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4 py-6">
      <div className="grid w-1/2 gap-3">
        {product.images.map((img) => (
          <div key={img.id} className="h-56 rounded-2xl border bg-cover bg-center" style={{ backgroundImage: `url(${img.url})` }} />
        ))}
      </div>
      <section className="w-1/2 rounded-2xl border bg-white p-4">
        <p className="text-xs text-slate-500">{product.category.name} / {product.branch.name}</p>
        <h1 className="mt-2 text-2xl font-black">{product.name}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-700">{product.description}</p>
        <div className="mt-5 space-y-3">
          {product.variants.map((variant) => (
            <div key={variant.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-semibold">{variant.color} - {variant.size} - {variant.shape}</p>
                <p className="text-xs text-slate-500">المتوفر: {variant.stockQty}</p>
              </div>
              <div className="text-left">
                <p className="font-black text-indigo-700">{formatCurrency(Number(variant.sellingPrice))}</p>
                <AddToCartButton variantId={variant.id} title={product.name} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
