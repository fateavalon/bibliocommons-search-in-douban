import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

declare const process: { env: Record<string, string | undefined> };

const DEFAULT_SITE_URL =
  "https://fateavalon.github.io/bibliocommons-search-in-douban";

function normalizeSiteUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

/**
 * Injects __SITE_URL__ in index.html (canonical, OG, Twitter).
 * Uses VITE_SITE_URL at build time (avoid %VAR% — Vite treats that as env replacement).
 * Emits robots.txt + sitemap.xml into dist/ after build (single-URL sitemap for Hash SPA).
 */
export function seoPlugin(): Plugin {
  return {
    name: "seo-html-and-files",
    transformIndexHtml(html) {
      const siteUrl = normalizeSiteUrl(
        process.env.VITE_SITE_URL || DEFAULT_SITE_URL,
      );
      return html.replace(/__SITE_URL__/g, siteUrl);
    },
    closeBundle() {
      const siteUrl = normalizeSiteUrl(
        process.env.VITE_SITE_URL || DEFAULT_SITE_URL,
      );
      const outDir = join(process.cwd(), "dist");
      const robots = [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${siteUrl}/sitemap.xml`,
        "",
      ].join("\n");
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
  </url>
</urlset>
`;
      writeFileSync(join(outDir, "robots.txt"), robots, "utf8");
      writeFileSync(join(outDir, "sitemap.xml"), sitemap, "utf8");
    },
  };
}
