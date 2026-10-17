"use client";

import { useHeaderState } from "../../../header.context";

export function useMenuEstimate() {
  const { closeMenu } = useHeaderState();
  return { closeMenu };
}
