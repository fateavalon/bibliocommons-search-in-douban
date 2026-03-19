import styles from "./SearchBar.module.css";

interface Props {
  value: string;
  onChange: (v: string) => void;
  activeCount: number;
  onToggleAdvanced: () => void;
  advancedOpen: boolean;
  statsText: string;
}

export function SearchBar({
  value,
  onChange,
  activeCount,
  onToggleAdvanced,
  advancedOpen,
  statsText,
}: Props) {
  return (
    <div className={styles.row}>
      <input
        type="text"
        className={styles.input}
        placeholder="搜索书名、作者、出版社..."
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        className={`${styles.toggle} ${advancedOpen ? styles.open : ""}`}
        onClick={onToggleAdvanced}
      >
        高级筛选 <span className={styles.arrow}>▼</span>
        {activeCount > 0 && (
          <span className={styles.badge}>{activeCount}</span>
        )}
      </button>
      <span className={styles.stats}>{statsText}</span>
    </div>
  );
}
