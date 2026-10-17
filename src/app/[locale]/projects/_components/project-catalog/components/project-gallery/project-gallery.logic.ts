"use client";

import { useCatalogState } from "../../project-catalog.context";

export function useProjectGallery() {
  const { category } = useCatalogState();
  return { category };
}
