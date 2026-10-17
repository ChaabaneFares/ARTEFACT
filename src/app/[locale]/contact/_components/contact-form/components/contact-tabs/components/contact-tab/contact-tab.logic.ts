"use client";

import type { ContactMode } from "@/app/[locale]/contact/_data/contact-runtime";
import { useFormState } from "../../../../contact-form.context";

export function useContactTab(mode: ContactMode) {
  const { busy, mode: selectedMode, changeMode } = useFormState();
  const select = () => changeMode(mode);
  return { busy, selected: selectedMode === mode, select };
}
