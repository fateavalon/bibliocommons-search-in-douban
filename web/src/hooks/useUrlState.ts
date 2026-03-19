import { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_FILTERS, type FilterState } from "../types";

function stateToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.query) p.set("q", f.query);
  if (f.ratingMin) p.set("rmin", f.ratingMin);
  if (f.ratingMax) p.set("rmax", f.ratingMax);
  if (f.countMin) p.set("cmin", f.countMin);
  if (f.yearMin) p.set("ymin", f.yearMin);
  if (f.yearMax) p.set("ymax", f.yearMax);
  if (f.tag) p.set("tag", f.tag);
  if (f.banner) p.set("hb", f.banner);
  if (f.honorOnly) p.set("hon", "1");
  if (!f.libLinkplus) p.set("noL", "1");
  if (!f.libSccl) p.set("noS", "1");
  if (!f.libSmcl) p.set("noM", "1");
  if (f.page > 1) p.set("p", String(f.page));
  if (f.pageSize !== 100) p.set("ps", String(f.pageSize));
  if (f.sortCol) {
    p.set("sc", f.sortCol);
    if (f.sortDir === -1) p.set("sd", "d");
  }
  if (f.modalBookIdx !== null) p.set("m", String(f.modalBookIdx));
  return p;
}

export function readInitialFromSearch(search: URLSearchParams): Partial<FilterState> {
  if ([...search.keys()].length === 0) return {};

  const s: Partial<FilterState> = {};
  const q = search.get("q");
  if (q) s.query = q;
  const rmin = search.get("rmin");
  if (rmin) s.ratingMin = rmin;
  const rmax = search.get("rmax");
  if (rmax) s.ratingMax = rmax;
  const cmin = search.get("cmin");
  if (cmin) s.countMin = cmin;
  const ymin = search.get("ymin");
  if (ymin) s.yearMin = ymin;
  const ymax = search.get("ymax");
  if (ymax) s.yearMax = ymax;
  const tag = search.get("tag");
  if (tag) s.tag = tag;
  const hb = search.get("hb");
  if (hb) s.banner = hb;
  if (search.get("hon") === "1") s.honorOnly = true;
  if (search.get("noL") === "1") s.libLinkplus = false;
  if (search.get("noS") === "1") s.libSccl = false;
  if (search.get("noM") === "1") s.libSmcl = false;
  const ps = search.get("ps");
  if (ps) s.pageSize = parseInt(ps) || DEFAULT_FILTERS.pageSize;
  const sc = search.get("sc");
  if (sc) s.sortCol = sc as FilterState["sortCol"];
  if (search.get("sd") === "d") s.sortDir = -1;
  const p = search.get("p");
  if (p) s.page = parseInt(p) || 1;
  const m = search.get("m");
  if (m !== null) s.modalBookIdx = parseInt(m);
  return s;
}

export function useSyncUrl(filters: FilterState) {
  const [, setSearchParams] = useSearchParams();
  const isInit = useRef(true);

  const sync = useCallback(() => {
    const params = stateToParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    if (isInit.current) {
      isInit.current = false;
      return;
    }
    sync();
  }, [sync]);
}
