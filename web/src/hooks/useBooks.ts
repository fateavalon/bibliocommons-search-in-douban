import { useMemo } from "react";
import type { Book, FilterState } from "../types";
import { sortBooks } from "../utils";

let _allBooks: Book[] | null = null;

export function getAllBooks(): Book[] {
  if (_allBooks) return _allBooks;
  const raw: Book[] = window.BOOKS || [];
  raw.forEach((b, i) => {
    b._i = i;
  });
  _allBooks = raw;
  return _allBooks;
}

function filterBooks(books: Book[], f: FilterState): Book[] {
  const q = f.query.toLowerCase().trim();
  const rMin = f.ratingMin ? parseFloat(f.ratingMin) : null;
  const rMax = f.ratingMax ? parseFloat(f.ratingMax) : null;
  const cMin = f.countMin ? parseInt(f.countMin) : null;
  const yMin = f.yearMin ? parseInt(f.yearMin) : null;
  const yMax = f.yearMax ? parseInt(f.yearMax) : null;
  const libAll = f.libLinkplus && f.libSccl && f.libSmcl;

  return books.filter((b) => {
    if (q) {
      const text = (
        (b.t || b.ot || "") +
        " " +
        (b.a || b.oa || "") +
        " " +
        (b.pub || "")
      ).toLowerCase();
      if (!text.includes(q)) return false;
    }
    const r = parseFloat(b.r || "0") || 0;
    if (rMin !== null && r < rMin) return false;
    if (rMax !== null && r > rMax) return false;
    if (cMin !== null && (parseInt(b.rc || "0") || 0) < cMin) return false;
    const yr = parseInt(b.y || "");
    if (yMin !== null && (isNaN(yr) || yr < yMin)) return false;
    if (yMax !== null && (isNaN(yr) || yr > yMax)) return false;
    if (f.tag && (!b.tags || !b.tags.split(" / ").includes(f.tag)))
      return false;
    if (f.honorOnly && !b.h) return false;
    if (f.banner && (!b.h || !b.h.includes(f.banner))) return false;
    if (!libAll) {
      const lib = b.lib || "";
      if (!f.libLinkplus && !f.libSccl && !f.libSmcl) return false;
      const match =
        (f.libLinkplus && lib.includes("L")) ||
        (f.libSccl && lib.includes("S")) ||
        (f.libSmcl && lib.includes("M"));
      if (!match) return false;
    }
    return true;
  });
}

export interface UseBooksResult {
  allBooks: Book[];
  filtered: Book[];
  paged: Book[];
  totalPages: number;
  total: number;
  filteredCount: number;
}

export function useBooks(filters: FilterState): UseBooksResult {
  const allBooks = getAllBooks();
  const total = allBooks.length;

  const filtered = useMemo(
    () => filterBooks(allBooks, filters),
    [allBooks, filters],
  );

  const sorted = useMemo(
    () => sortBooks(filtered, filters.sortCol, filters.sortDir),
    [filtered, filters.sortCol, filters.sortDir],
  );

  const pageSize =
    filters.pageSize === 0 ? sorted.length || 1 : filters.pageSize;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  return {
    allBooks,
    filtered: sorted,
    paged,
    totalPages,
    total,
    filteredCount: sorted.length,
  };
}

export function useTagOptions(): { tag: string; count: number }[] {
  const allBooks = getAllBooks();
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of allBooks) {
      if (!b.tags) continue;
      for (const raw of b.tags.split(" / ")) {
        const t = raw.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [allBooks]);
}

const BANNER_RE = /No\.\d+\s+(.+)/;

export function useBannerOptions(): { name: string; count: number }[] {
  const allBooks = getAllBooks();
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of allBooks) {
      if (!b.h) continue;
      const seen = new Set<string>();
      for (const raw of b.h.split(" | ")) {
        const m = raw.trim().match(BANNER_RE);
        if (m && !seen.has(m[1])) {
          seen.add(m[1]);
          counts[m[1]] = (counts[m[1]] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allBooks]);
}
