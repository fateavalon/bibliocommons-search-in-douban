import { useState } from "react";
import styles from "./Pagination.module.css";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  const [jumpVal, setJumpVal] = useState("");

  if (totalPages <= 1) return null;

  const maxButtons = 7;
  let sp = Math.max(1, page - Math.floor(maxButtons / 2));
  let ep = Math.min(totalPages, sp + maxButtons - 1);
  if (ep - sp < maxButtons - 1) sp = Math.max(1, ep - maxButtons + 1);

  const pages: (number | "...")[] = [];
  if (sp > 1) {
    pages.push(1);
    if (sp > 2) pages.push("...");
  }
  for (let p = sp; p <= ep; p++) pages.push(p);
  if (ep < totalPages) {
    if (ep < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  function go(p: number) {
    onPageChange(p);
    window.scrollTo(0, 0);
  }

  return (
    <div className={styles.pagination}>
      <button
        className={styles.btn}
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        ‹ 上一页
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={`${styles.btn} ${p === page ? styles.active : ""}`}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className={styles.btn}
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        下一页 ›
      </button>
      <span className={styles.jump}>
        跳转
        <input
          type="number"
          min={1}
          max={totalPages}
          value={jumpVal}
          placeholder={String(page)}
          onChange={(e) => setJumpVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = parseInt(jumpVal) || page;
              go(Math.max(1, Math.min(v, totalPages)));
              setJumpVal("");
            }
          }}
        />
        / {totalPages}
      </span>
    </div>
  );
}
