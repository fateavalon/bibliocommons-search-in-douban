import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./HonorAutocomplete.module.css";

interface Option {
  name: string;
  count: number;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

export function HonorAutocomplete({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = value
    ? options.filter((o) =>
        o.name.toLowerCase().includes(value.toLowerCase()),
      )
    : options;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        close();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [close]);

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-val]");
      items[activeIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && filtered[activeIdx]) {
        onChange(filtered[activeIdx].name);
        close();
      }
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        type="text"
        className={styles.input}
        placeholder="输入搜索榜单..."
        autoComplete="off"
        value={value}
        onFocus={() => {
          setOpen(true);
          setActiveIdx(-1);
        }}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div className={styles.dropdown} ref={listRef}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>无匹配结果</div>
          ) : (
            filtered.map((o, i) => (
              <div
                key={o.name}
                className={`${styles.item} ${i === activeIdx ? styles.active : ""}`}
                data-val={o.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.name);
                  close();
                }}
              >
                {o.name}
                <span className={styles.count}>({o.count})</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
