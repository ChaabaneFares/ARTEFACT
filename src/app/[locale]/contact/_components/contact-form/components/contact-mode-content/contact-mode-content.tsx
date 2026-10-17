"use client";
import type { ReactNode } from "react";
import type { ContactMode } from "../../../../_data/contact-runtime";

import { useContactModeContent } from "./contact-mode-content.logic";
export default function ContactModeContent({
  mode,
  children,
}: {
  mode: ContactMode;
  children: ReactNode;
}) {
  const { visible } = useContactModeContent(mode);
  return visible ? children : null;
}
