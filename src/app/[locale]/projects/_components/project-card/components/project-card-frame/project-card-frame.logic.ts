"use client";

import { useCatalogState } from "../../../project-catalog/project-catalog.context";
import type { CategoryIndexes } from "../../project-card.types";

export function useProjectCardFrame(categoryIndexes: CategoryIndexes) {
  const { category, mobile } = useCatalogState();
  const index = categoryIndexes[category] ?? -1;
  return { index, mobile };
}
