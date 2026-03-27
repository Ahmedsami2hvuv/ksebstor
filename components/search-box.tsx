"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
      }}
    >
      <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-9"
        placeholder="بحث ذكي بالاسم أو الوصف أو SKU"
      />
    </form>
  );
}
