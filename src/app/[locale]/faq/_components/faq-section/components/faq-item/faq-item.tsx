import type { FaqEntry } from "../../../../_data/faq";
import FaqItemClient from "./faq-item.client";
import styles from "./faq-item.module.css";

export default function FaqItem({ entry }: { entry: FaqEntry }) {
  return (
    <FaqItemClient
      id={entry.id}
      question={
        <>
          <span className={styles.plus} aria-hidden="true">
            <span />
            <span />
          </span>
          <svg
            className={styles.arrow}
            aria-hidden="true"
            viewBox="0 0 19.242 11.121"
          >
            <path
              d="m2.121 2.122 7.5 7.5 7.5-7.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          </svg>
          <span className={styles.label}>{entry.question}</span>
        </>
      }
    >
      <p>{entry.answer}</p>
    </FaqItemClient>
  );
}
