"use client";

import { useHeaderState } from "../../header.context";

export function useHeaderTopLink() {
  const { pathname } = useHeaderState();
  return { pathname };
}
