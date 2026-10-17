"use client";

import type { ReactNode } from "react";
import styles from "../../project-catalog.module.css";
import { useProjectGallery } from "./project-gallery.logic";

export default function ProjectGallery({ children }: { children: ReactNode }) {
  const { category } = useProjectGallery();
  return (
    <div key={category} className={styles.gallery} data-project-gallery>
      <div className={styles.grid}>{children}</div>
    </div>
  );
}
