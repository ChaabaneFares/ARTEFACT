"use client";

import type { ReactNode } from "react";
import styles from "../../contact-form.module.css";
import { useContactTabs } from "./contact-tabs.logic";

export default function ContactTabs({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const { handleTabKey } = useContactTabs();
  return (
    <div
      className={styles.tabs}
      data-page-transition-item
      role="tablist"
      aria-label={label}
      onKeyDown={handleTabKey}
    >
      {children}
    </div>
  );
}
