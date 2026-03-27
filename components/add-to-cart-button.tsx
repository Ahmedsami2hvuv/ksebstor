"use client";

type Props = { variantId: string; title: string };

export default function AddToCartButton({ variantId, title }: Props) {
  return (
    <button
      className="mt-2 bg-indigo-600 text-white hover:bg-indigo-700"
      onClick={() => {
        const existing = localStorage.getItem("kseb_cart");
        const cart = existing ? (JSON.parse(existing) as { variantId: string; quantity: number; title: string }[]) : [];
        const found = cart.find((c) => c.variantId === variantId);
        if (found) found.quantity += 1;
        else cart.push({ variantId, quantity: 1, title });
        localStorage.setItem("kseb_cart", JSON.stringify(cart));
        alert("تمت إضافة المنتج إلى السلة");
      }}
    >
      إضافة للسلة
    </button>
  );
}
