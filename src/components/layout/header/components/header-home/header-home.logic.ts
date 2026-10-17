"use client";

import { useHeaderState } from "../../header.context";

export function useHeaderHome() {
  const { closeMenu } = useHeaderState();
  return { closeMenu };
}
