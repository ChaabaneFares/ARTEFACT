"use client";

import { useHeaderState } from "../../header.context";

export function useHeaderTopLinks() {
  const { hideTopLinks, phase } = useHeaderState();
  return { hideTopLinks, phase };
}
