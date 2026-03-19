import { parseBannerName } from "../utils";
import styles from "./HonorTag.module.css";

interface Props {
  text: string;
  onClick?: (banner: string) => void;
}

export function HonorTag({ text, onClick }: Props) {
  const banner = parseBannerName(text);
  return (
    <span
      className={styles.tag}
      onClick={onClick ? () => onClick(banner) : undefined}
    >
      {text}
    </span>
  );
}
