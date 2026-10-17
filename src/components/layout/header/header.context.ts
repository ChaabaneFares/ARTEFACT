"use client";

import { createContext, useContext } from "react";
import type { useHeaderLogic } from "./header.client.logic";

export const HeaderContext = createContext<ReturnType<
  typeof useHeaderLogic
> | null>(null);
export function useHeaderState() {
  const state = useContext(HeaderContext);
  if (!state) throw new Error("Header controls require a header");
  return state;
}
