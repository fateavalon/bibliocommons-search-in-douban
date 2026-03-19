import type { FilterState } from "../types";
import { HonorAutocomplete } from "./HonorAutocomplete";
import styles from "./AdvancedFilters.module.css";

interface Props {
  filters: FilterState;
  open: boolean;
  tagOptions: { tag: string; count: number }[];
  bannerOptions: { name: string; count: number }[];
  onChange: (patch: Partial<FilterState>) => void;
  onClear: () => void;
  minYear: number;
}

export function AdvancedFilters({
  filters,
  open,
  tagOptions,
  bannerOptions,
  onChange,
  onClear,
  minYear,
}: Props) {
  if (!open) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        <div className={styles.group}>
          <label>评分范围</label>
          <div className={styles.rangeRow}>
            <input
              type="number"
              placeholder="最低"
              min={0}
              max={10}
              step={0.1}
              value={filters.ratingMin}
              onChange={(e) => onChange({ ratingMin: e.target.value, page: 1 })}
            />
            <span className={styles.sep}>—</span>
            <input
              type="number"
              placeholder="最高"
              min={0}
              max={10}
              step={0.1}
              value={filters.ratingMax}
              onChange={(e) => onChange({ ratingMax: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className={styles.group}>
          <label>最少评分人数</label>
          <div className={styles.rangeRow}>
            <input
              type="number"
              placeholder="例: 100"
              min={0}
              step={1}
              value={filters.countMin}
              onChange={(e) => onChange({ countMin: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className={styles.group}>
          <label>出版年份</label>
          <div className={styles.rangeRow}>
            <input
              type="number"
              placeholder="起始"
              min={minYear}
              max={2030}
              step={1}
              value={filters.yearMin}
              onChange={(e) => onChange({ yearMin: e.target.value, page: 1 })}
            />
            <span className={styles.sep}>—</span>
            <input
              type="number"
              placeholder="结束"
              min={minYear}
              max={2030}
              step={1}
              value={filters.yearMax}
              onChange={(e) => onChange({ yearMax: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className={styles.group}>
          <label>标签</label>
          <select
            value={filters.tag}
            onChange={(e) => onChange({ tag: e.target.value, page: 1 })}
          >
            <option value="">全部标签</option>
            {tagOptions.map((o) => (
              <option key={o.tag} value={o.tag}>
                {o.tag} ({o.count})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.group}>
          <label>图书馆</label>
          <div className={styles.checkRow}>
            <input
              type="checkbox"
              id="libLinkplus"
              checked={filters.libLinkplus}
              onChange={(e) => onChange({ libLinkplus: e.target.checked, page: 1 })}
            />
            <label className={styles.checkLabel} htmlFor="libLinkplus">LINK+</label>
            <input
              type="checkbox"
              id="libSccl"
              checked={filters.libSccl}
              onChange={(e) => onChange({ libSccl: e.target.checked, page: 1 })}
            />
            <label className={styles.checkLabel} htmlFor="libSccl">SCCL</label>
            <input
              type="checkbox"
              id="libSmcl"
              checked={filters.libSmcl}
              onChange={(e) => onChange({ libSmcl: e.target.checked, page: 1 })}
            />
            <label className={styles.checkLabel} htmlFor="libSmcl">SMCL</label>
          </div>
        </div>

        <div className={styles.group}>
          <label>榜单荣誉</label>
          <HonorAutocomplete
            options={bannerOptions}
            value={filters.banner}
            onChange={(v) => onChange({ banner: v, page: 1 })}
          />
          <div className={styles.checkRow} style={{ marginTop: 6 }}>
            <input
              type="checkbox"
              id="honorOnly"
              checked={filters.honorOnly}
              onChange={(e) => onChange({ honorOnly: e.target.checked, page: 1 })}
            />
            <label className={styles.checkLabel} htmlFor="honorOnly">
              仅显示有榜单荣誉的图书
            </label>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnClear} onClick={onClear}>
          清除全部
        </button>
        <button className={styles.btnApply}>应用筛选</button>
      </div>
    </div>
  );
}
