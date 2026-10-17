"use client";

import { createContext, useContext } from "react";
import type { useProjectCatalog } from "./project-catalog.client.logic";

export const CatalogContext = createContext<ReturnType<
  typeof useProjectCatalog
> | null>(null);
export function useCatalogState() {
  const state = useContext(CatalogContext);
  if (!state) throw new Error("Project controls require a catalog");
  return state;
}
