import { useMemo } from "react";
import type { Book } from "../types";
import { getAllBooks } from "./useBooks";

const TOP250_BANNER = "豆瓣图书Top250";
const RANK_RE = /No\.(\d+)/;

function bookKey(b: Book): string {
  return ((b.t || b.ot || "") + "|" + (b.a || b.oa || "")).toLowerCase();
}

function extractRank(h: string, banner: string): number {
  for (const part of h.split(" | ")) {
    if (part.includes(banner)) {
      const m = part.match(RANK_RE);
      if (m) return parseInt(m[1]);
    }
  }
  return Infinity;
}

export interface BannerSection {
  name: string;
  books: Book[];
}

export interface Recommendations {
  newHighRated: Book[];
  top250: Book[];
  bannerSections: BannerSection[];
  hiddenGems: Book[];
  topTags: { tag: string; count: number }[];
}

export function useRecommendations(): Recommendations {
  const allBooks = getAllBooks();
  return useMemo(() => compute(allBooks), [allBooks]);
}

function compute(allBooks: Book[]): Recommendations {
  const currentYear = new Date().getFullYear();

  // --- 高分新书 ---
  const newHighRated = allBooks
    .filter((b) => {
      const y = parseInt(b.y || "");
      const r = parseFloat(b.r || "0") || 0;
      const rc = parseInt(b.rc || "0") || 0;
      return y >= currentYear - 1 && r >= 8.5 && rc >= 50;
    })
    .sort((a, b) => (b.wr ?? 0) - (a.wr ?? 0))
    .slice(0, 20);

  // --- 豆瓣图书 Top 250 (multi-pass edition matching) ---
  // Pass 1: collect {title,author} -> rank for books with explicit Top250 honor
  const top250Map = new Map<string, number>();
  for (const b of allBooks) {
    if (!b.h || !b.h.includes(TOP250_BANNER)) continue;
    const key = bookKey(b);
    const rank = extractRank(b.h, TOP250_BANNER);
    const existing = top250Map.get(key);
    if (existing === undefined || rank < existing) {
      top250Map.set(key, rank);
    }
  }
  // Pass 2: find all matching editions, deduplicate by key keeping highest rc
  const top250Best = new Map<string, Book>();
  for (const b of allBooks) {
    const key = bookKey(b);
    if (!top250Map.has(key)) continue;
    const existing = top250Best.get(key);
    if (
      !existing ||
      (parseInt(b.rc || "0") || 0) > (parseInt(existing.rc || "0") || 0)
    ) {
      top250Best.set(key, b);
    }
  }
  const top250 = [...top250Best.entries()]
    .sort((a, b) => (top250Map.get(a[0]) ?? Infinity) - (top250Map.get(b[0]) ?? Infinity))
    .map(([, book]) => book)
    .slice(0, 20);

  // --- 热门榜单 (top 3 banners excluding Top250) ---
  const BANNER_RE = /No\.\d+\s+(.+)/;
  const bannerCounts: Record<string, number> = {};
  for (const b of allBooks) {
    if (!b.h) continue;
    const seen = new Set<string>();
    for (const part of b.h.split(" | ")) {
      const m = part.trim().match(BANNER_RE);
      if (m && !seen.has(m[1]) && m[1] !== TOP250_BANNER) {
        seen.add(m[1]);
        bannerCounts[m[1]] = (bannerCounts[m[1]] || 0) + 1;
      }
    }
  }
  const topBannerNames = Object.entries(bannerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const bannerSections: BannerSection[] = topBannerNames.map((name) => {
    const books = allBooks
      .filter((b) => b.h && b.h.includes(name))
      .sort((a, b) => (b.wr ?? 0) - (a.wr ?? 0))
      .slice(0, 8);
    return { name, books };
  });

  // --- 遗珠推荐 ---
  const hiddenGems = allBooks
    .filter((b) => {
      const r = parseFloat(b.r || "0") || 0;
      const rc = parseInt(b.rc || "0") || 0;
      return r >= 8.5 && rc > 0 && rc < 200;
    })
    .sort((a, b) => parseFloat(b.r || "0") - parseFloat(a.r || "0"))
    .slice(0, 20);

  // --- 热门标签 ---
  const tagCounts: Record<string, number> = {};
  for (const b of allBooks) {
    if (!b.tags) continue;
    for (const raw of b.tags.split(" / ")) {
      const t = raw.trim();
      if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));

  return { newHighRated, top250, bannerSections, hiddenGems, topTags };
}
