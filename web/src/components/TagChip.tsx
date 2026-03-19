import styles from "./TagChip.module.css";

interface Props {
  tag: string;
  active?: boolean;
  onClick?: (tag: string) => void;
  clickable?: boolean;
}

export function TagChip({ tag, active, onClick, clickable = true }: Props) {
  return (
    <span
      className={`${styles.chip} ${active ? styles.active : ""} ${clickable ? styles.clickable : ""}`}
      onClick={clickable && onClick ? () => onClick(tag) : undefined}
    >
      {tag}
    </span>
  );
}
