import { useEffect, useRef } from "react";
import type { Book } from "../types";
import { coverUrl, ratingColor, stars } from "../utils";
import { TagChip } from "./TagChip";
import styles from "./BookModal.module.css";

interface Props {
  book: Book | null;
  onClose: () => void;
}

export function BookModal({ book, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const prevSrcRef = useRef("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (book) {
      document.body.classList.add("modal-open");
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [book, onClose]);

  if (!book) return null;

  const b = book;
  const r = parseFloat(b.r || "0") || 0;
  const rc = parseInt(b.rc || "0") || 0;
  const imgSrc = b.cv ? coverUrl(b.cv) : "";
  const author = b.a || b.oa || "";
  const press = b.press || b.pub || "";
  const honors = b.h
    ? b.h.split(" | ").map((s) => s.trim()).filter(Boolean)
    : [];
  const tags = b.tags
    ? b.tags.split(" / ").map((s) => s.trim()).filter(Boolean)
    : [];

  if (imgSrc && imgSrc !== prevSrcRef.current) {
    prevSrcRef.current = imgSrc;
  }

  const meta: { label: string; value: string }[] = [];
  if (author) meta.push({ label: "作者", value: author });
  if (b.tr) meta.push({ label: "译者", value: b.tr });
  if (press) meta.push({ label: "出版社", value: press });
  if (b.pd) meta.push({ label: "出版日期", value: b.pd });
  if (b.pg) meta.push({ label: "页数", value: b.pg });
  if (b.pr) meta.push({ label: "定价", value: b.pr });
  if (b.bs) meta.push({ label: "丛书", value: b.bs });
  if (b.isbn) meta.push({ label: "ISBN", value: b.isbn });

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className={styles.card}>
        <button className={styles.close} onClick={onClose}>
          &times;
        </button>
        <div className={styles.header}>
          {imgSrc ? (
            <img className={styles.cover} src={imgSrc} alt="" />
          ) : null}
          <div className={styles.info}>
            {honors.length > 0 && (
              <div className={styles.honors}>
                {honors.map((h, i) => (
                  <span key={i} className={styles.honorTag}>
                    {h}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.title}>{b.t || b.ot || ""}</div>
            {b.sub && <div className={styles.subtitle}>{b.sub}</div>}
            <div className={styles.meta}>
              {meta.map((m) => (
                <span key={m.label} className={styles.metaLine}>
                  <span className={styles.metaKey}>{m.label}</span>
                  {m.value}
                </span>
              ))}
            </div>
            {r > 0 && (
              <div className={styles.ratingRow}>
                <span
                  className={styles.ratingVal}
                  style={{ color: ratingColor(r) }}
                >
                  {r.toFixed(1)}
                </span>
                <span className={styles.ratingStars}>{stars(r)}</span>
                <span className={styles.ratingCount}>
                  {rc.toLocaleString()}人评价
                </span>
              </div>
            )}
          </div>
        </div>

        {b.intro && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>内容简介</div>
            <div className={styles.intro}>{b.intro}</div>
          </div>
        )}

        {tags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>标签</div>
            <div className={styles.tags}>
              {tags.map((t) => (
                <TagChip key={t} tag={t} clickable={false} />
              ))}
            </div>
          </div>
        )}

        <div className={styles.links}>
          {b.di && (
            <a
              className={`${styles.linkBtn} ${styles.douban}`}
              href={`https://book.douban.com/subject/${b.di}/`}
              target="_blank"
            >
              豆瓣页面
            </a>
          )}
          {b.srid && (
            <a
              className={`${styles.linkBtn} ${styles.sccl}`}
              href={`https://sccl.bibliocommons.com/v2/record/${b.srid}`}
              target="_blank"
            >
              SCCL 馆藏
            </a>
          )}
          {b.smrid && (
            <a
              className={`${styles.linkBtn} ${styles.smcl}`}
              href={`https://smcl.bibliocommons.com/v2/record/${b.smrid}`}
              target="_blank"
            >
              SMCL 馆藏
            </a>
          )}
          {b.rid && (
            <a
              className={`${styles.linkBtn} ${styles.linkplus}`}
              href={`https://csul.iii.com/record=${b.rid}`}
              target="_blank"
            >
              LINK+ 馆藏
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
