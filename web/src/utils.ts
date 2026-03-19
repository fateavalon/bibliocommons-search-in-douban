import type { Book, SortCol, SortDir } from "./types";

const IMG_PROXY =
  import.meta.env.VITE_IMG_PROXY_BASE ||
  window.IMG_PROXY_BASE ||
  "/douban-img/";

export function coverUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.includes("doubanio.com"))
    return IMG_PROXY + encodeURIComponent(url);
  return url;
}

export function badgeClass(r: number): string {
  if (r >= 9) return "badge-excellent";
  if (r >= 8) return "badge-great";
  if (r >= 7) return "badge-good";
  if (r >= 6) return "badge-ok";
  return "badge-low";
}

export function ratingColor(r: number): string {
  if (r >= 9) return "#166534";
  if (r >= 8) return "#1e40af";
  if (r >= 7) return "#92400e";
  if (r >= 6) return "#9a3412";
  return "#991b1b";
}

export function stars(r: number): string {
  const full = Math.round(r / 2);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

const BANNER_RE = /No\.\d+\s+(.+)/;

export function parseBannerName(honor: string): string {
  const m = honor.match(BANNER_RE);
  return m ? m[1] : honor;
}

export function sortBooks(
  books: Book[],
  col: SortCol,
  dir: SortDir,
): Book[] {
  if (!col) return books;
  const sorted = [...books];
  sorted.sort((a, b) => {
    let va: string | number, vb: string | number;
    switch (col) {
      case "rank":
        va = a._i ?? 0;
        vb = b._i ?? 0;
        break;
      case "title":
        va = a.t || a.ot || "";
        vb = b.t || b.ot || "";
        break;
      case "author":
        va = a.a || a.oa || "";
        vb = b.a || b.oa || "";
        break;
      case "year":
        va = parseInt(a.y || "0") || 0;
        vb = parseInt(b.y || "0") || 0;
        break;
      case "rating":
        va = parseFloat(a.r || "0") || 0;
        vb = parseFloat(b.r || "0") || 0;
        break;
      case "count":
        va = parseInt(a.rc || "0") || 0;
        vb = parseInt(b.rc || "0") || 0;
        break;
      default:
        return 0;
    }
    if (typeof va === "number" && typeof vb === "number")
      return (va - vb) * dir;
    return String(va).localeCompare(String(vb), "zh") * dir;
  });
  return sorted;
}
