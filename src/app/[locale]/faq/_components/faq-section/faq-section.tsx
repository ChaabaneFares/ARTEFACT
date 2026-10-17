import type { FaqEntry } from "../../_data/faq";
import FaqItem from "./components/faq-item/faq-item";
import FaqSectionClient from "./faq-section.client";
import styles from "./faq-section.module.css";

type FaqSectionProps = {
  entries: readonly FaqEntry[];
  label: string;
  fade?: boolean;
};

export default function FaqSection({
  entries,
  label,
  fade = false,
}: FaqSectionProps) {
  return (
    <FaqSectionClient label={label} fade={fade}>
      <div className={styles.wrapper}>
        {[entries.slice(0, 5), entries.slice(5)].map((column, index) => (
          <div key={index === 0 ? "first" : "second"} className={styles.grid}>
            {column.map((entry) => (
              <FaqItem key={entry.id} entry={entry} />
            ))}
          </div>
        ))}
      </div>
    </FaqSectionClient>
  );
}
