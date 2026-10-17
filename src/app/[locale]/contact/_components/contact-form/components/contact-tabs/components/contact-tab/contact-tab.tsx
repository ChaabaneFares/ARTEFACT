"use client";

import type { ReactNode } from "react";
import type { ContactMode } from "@/app/[locale]/contact/_data/contact-runtime";
import { useContactTab } from "./contact-tab.logic";

export default function ContactTab({
  mode,
  children,
}: {
  mode: ContactMode;
  children: ReactNode;
}) {
  const { busy, selected, select } = useContactTab(mode);
  return (
    <button
      type="button"
      id={`${mode}-tab`}
      disabled={busy}
      role="tab"
      data-mode={mode}
      aria-selected={selected}
      aria-controls="contact-form-panel"
      tabIndex={selected ? 0 : -1}
      onClick={select}
    >
      {children}
    </button>
  );
}
