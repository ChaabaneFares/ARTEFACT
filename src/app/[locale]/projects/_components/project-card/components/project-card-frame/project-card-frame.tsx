"use client";

import type { ReactNode } from "react";
import styles from "../../project-card.module.css";
import type { CategoryIndexes } from "../../project-card.types";
import { useProjectCardFrame } from "./project-card-frame.logic";

export default function ProjectCardFrame({
  categoryIndexes,
  kind,
  children,
}: {
  categoryIndexes: CategoryIndexes;
  kind: "tour" | "video" | "image";
  children: ReactNode;
}) {
  const { index, mobile } = useProjectCardFrame(categoryIndexes);
  if (index < 0) return null;
  return (
    <article
      className={`${styles.card} ${kind === "tour" ? styles.tour : ""} ${kind === "video" ? styles.video : ""}`}
      data-project-card
      data-page-transition-item={index < 2 && !mobile ? "" : undefined}
      data-project-kind={kind}
    >
      {children}
    </article>
  );
}
