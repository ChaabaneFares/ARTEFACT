"use client";

import { createContext, useContext } from "react";
import type { useFaqSection } from "./faq-section.client.logic";

export const FaqContext = createContext<ReturnType<
  typeof useFaqSection
> | null>(null);
export function useFaqState() {
  const state = useContext(FaqContext);
  if (!state) throw new Error("FAQ items require a FAQ section");
  return state;
}
