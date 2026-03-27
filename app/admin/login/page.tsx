"use client";

import { useState } from "react";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const next = searchParams?.next || "/admin";

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    const password = String(formData.get("password") ?? "");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "فشل تسجيل الدخول");
      setLoading(false);
      return;
    }
    window.location.href = data.redirectTo ?? "/admin";
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <h1 className="text-2xl font-black">تسجيل دخول الإدارة</h1>
      <p className="mt-2 text-sm text-slate-600">هذه الصفحة خاصة بالإدارة ولا تظهر للزبائن.</p>
      <form action={onSubmit} className="mt-5 space-y-3 rounded-2xl border bg-white p-4">
        <input name="password" type="password" placeholder="كلمة مرور الإدارة" required />
        <button disabled={loading} className="bg-indigo-600 text-white disabled:opacity-50">
          {loading ? "جاري..." : "دخول"}
        </button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </form>
    </main>
  );
}

