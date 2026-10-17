"use client";

import type { ReactNode } from "react";
import styles from "../../header.module.css";
import { useHeaderTopLinks } from "./header-top-links.logic";

export default function HeaderTopLinks({ children }: { children: ReactNode }) {
  const { hideTopLinks, phase } = useHeaderTopLinks();
  return (
    <div
      className={styles.desktopLinks}
      data-hidden={hideTopLinks}
      data-menu-hidden={phase !== "closed"}
      inert={hideTopLinks}
    >
      {children}
    </div>
  );
}
