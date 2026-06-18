"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DestinationCard } from "@/components/fastbird";
import { destinations, regions, type Region } from "@/constants/destinations";

const PAGE_SIZE = 12;
type Filter = Region | "All";

export const ProductsCatalog = () => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Filter>("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((dest) => {
      const matchesRegion = region === "All" || dest.region === region;
      const matchesQuery = !q || dest.name.toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    });
  }, [query, region]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleRegion = (value: Filter) => {
    setRegion(value);
    setPage(1);
  };

  const filters: Filter[] = ["All", ...regions];

  return (
    <div>
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder="Search a country or region"
          aria-label="Search destinations"
          className="h-12 w-full rounded-md border border-line bg-surface-card pl-11 pr-4 text-[15px] text-ink placeholder:text-ink-soft fb-focus"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => handleRegion(f)}
            aria-pressed={region === f}
            className={cn(
              "rounded-pill border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.06em] transition-colors fb-focus",
              region === f
                ? "border-forest bg-forest text-on-dark"
                : "border-line bg-surface-card text-ink-soft hover:bg-sand"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="mt-6 font-mono text-xs text-ink-soft">
        {filtered.length} {filtered.length === 1 ? "destination" : "destinations"}
      </p>

      {pageItems.length === 0 ? (
        <div className="mt-8 rounded-md border border-line bg-sand p-10 text-center">
          <p className="font-heading text-h3 text-ink">No matches yet</p>
          <p className="mt-2 text-[15px] text-ink-soft">
            Try a different country name or clear the filters.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((dest) => (
            <DestinationCard key={dest.slug} destination={dest} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-12 flex items-center justify-center gap-1.5"
          aria-label="Pagination"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-soft transition-colors hover:bg-sand disabled:opacity-40 disabled:hover:bg-transparent fb-focus"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === safePage ? "page" : undefined}
              className={cn(
                "h-9 min-w-9 rounded-md border px-3 font-mono text-sm transition-colors fb-focus",
                p === safePage
                  ? "border-forest bg-forest text-on-dark"
                  : "border-line text-ink-soft hover:bg-sand"
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-soft transition-colors hover:bg-sand disabled:opacity-40 disabled:hover:bg-transparent fb-focus"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
};
