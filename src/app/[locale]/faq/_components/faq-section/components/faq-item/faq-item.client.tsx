"use client";

import type { ReactNode } from "react";
import { useFaqItem } from "./faq-item.client.logic";
import styles from "./faq-item.module.css";

export default function FaqItemClient({
  id,
  question,
  children,
}: {
  id: string;
  question: ReactNode;
  children: ReactNode;
}) {
  const {
    handleToggle,
    handleEnter,
    handleLeave,
    handleMaskRef,
    answerStyle,
    open,
    dimmed,
  } = useFaqItem(id);
  return (
    <article className={styles.item} data-open={open} data-dimmed={dimmed}>
      <h2>
        <button
          id={`${id}-question`}
          className={styles.question}
          type="button"
          onClick={handleToggle}
          onPointerEnter={handleEnter}
          onPointerLeave={handleLeave}
          aria-expanded={open}
          aria-controls={`${id}-answer`}
        >
          {question}
        </button>
      </h2>
      <section
        id={`${id}-answer`}
        className={styles.answer}
        style={answerStyle}
        aria-labelledby={`${id}-question`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className={styles.mask} ref={handleMaskRef}>
          {children}
        </div>
      </section>
    </article>
  );
}
