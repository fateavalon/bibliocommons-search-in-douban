import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterProvider, useFilters, useFilterDispatch } from "../context/FilterContext";
import { useBooks, useTagOptions, useBannerOptions, getAllBooks } from "../hooks/useBooks";
import { readInitialFromSearch, useSyncUrl } from "../hooks/useUrlState";
import type { FilterState, SortCol } from "../types";
import { SearchBar } from "../components/SearchBar";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { BookTable } from "../components/BookTable";
import { Pagination } from "../components/Pagination";
import { BookModal } from "../components/BookModal";
import styles from "./BooksPage.module.css";

export function BooksPage() {
  const [searchParams] = useSearchParams();
  const initialOverrides = useMemo(
    () => readInitialFromSearch(searchParams),
    // Only compute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <FilterProvider initialOverrides={initialOverrides}>
      <BooksPageInner />
    </FilterProvider>
  );
}

function BooksPageInner() {
  const filters = useFilters();
  const dispatch = useFilterDispatch();
  const { paged, totalPages, total, filteredCount } = useBooks(filters);
  const tagOptions = useTagOptions();
  const bannerOptions = useBannerOptions();

  const [advOpen, setAdvOpen] = useState(() => countActive(filters) > 0);

  useSyncUrl(filters);

  const set = useCallback(
    (patch: Partial<FilterState>) => dispatch({ type: "SET", payload: patch }),
    [dispatch],
  );

  const activeCount = useMemo(() => countActive(filters), [filters]);

  const page = Math.min(filters.page, totalPages);
  const end = Math.min(
    page * (filters.pageSize === 0 ? filteredCount : filters.pageSize),
    filteredCount,
  );

  const statsText =
    `显示 ${end} / ${filteredCount}` +
    (filteredCount < total ? ` (筛选自 ${total})` : "");

  const allBooks = getAllBooks();
  const modalBook =
    filters.modalBookIdx !== null ? allBooks[filters.modalBookIdx] ?? null : null;

  const minYear = useMemo(() => {
    let min = 9999;
    for (const b of allBooks) {
      const y = parseInt(b.y || "");
      if (!isNaN(y) && y > 0 && y < min) min = y;
    }
    return min === 9999 ? 1900 : min;
  }, [allBooks]);

  function handleSort(col: SortCol) {
    if (filters.sortCol === col) {
      set({ sortDir: filters.sortDir === 1 ? -1 : 1, page: 1 });
    } else {
      set({ sortCol: col, sortDir: 1, page: 1 });
    }
  }

  function handleTagClick(tag: string) {
    set({ tag: filters.tag === tag ? "" : tag, page: 1 });
    if (!advOpen) setAdvOpen(true);
  }

  function handleBannerClick(banner: string) {
    set({ banner: filters.banner === banner ? "" : banner, page: 1 });
    if (!advOpen) setAdvOpen(true);
  }

  return (
    <div className={styles.container}>
      <div className={styles.subtitle}>
        大陆出版 · {minYear}年至今 · 共 {total} 本有评分图书
      </div>

      <SearchBar
        value={filters.query}
        onChange={(q) => set({ query: q, page: 1 })}
        activeCount={activeCount}
        onToggleAdvanced={() => setAdvOpen((o) => !o)}
        advancedOpen={advOpen}
        statsText={statsText}
      />

      <AdvancedFilters
        filters={filters}
        open={advOpen}
        tagOptions={tagOptions}
        bannerOptions={bannerOptions}
        onChange={set}
        onClear={() => {
          dispatch({ type: "CLEAR" });
          setAdvOpen(false);
        }}
        minYear={minYear}
      />

      <div className={styles.toolbar}>
        <div className={styles.pageSize}>
          <label>每页</label>
          <select
            value={filters.pageSize}
            onChange={(e) =>
              set({ pageSize: parseInt(e.target.value), page: 1 })
            }
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={0}>全部</option>
          </select>
          <span>条</span>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) => set({ page: p })}
        />
      </div>

      <BookTable
        books={paged}
        sortCol={filters.sortCol}
        sortDir={filters.sortDir}
        onSort={handleSort}
        onOpenModal={(idx) => set({ modalBookIdx: idx })}
        onTagClick={handleTagClick}
        onBannerClick={handleBannerClick}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => set({ page: p })}
      />

      <BookModal
        book={modalBook}
        onClose={() => set({ modalBookIdx: null })}
      />
    </div>
  );
}

function countActive(f: FilterState): number {
  let n = 0;
  if (f.ratingMin) n++;
  if (f.ratingMax) n++;
  if (f.countMin) n++;
  if (f.yearMin) n++;
  if (f.yearMax) n++;
  if (f.tag) n++;
  if (f.banner) n++;
  if (f.honorOnly) n++;
  if (!f.libLinkplus || !f.libSccl || !f.libSmcl) n++;
  return n;
}
