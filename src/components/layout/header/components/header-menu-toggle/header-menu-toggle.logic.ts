"use client";

import { useHeaderState } from "../../header.context";

export function useHeaderMenuToggle() {
  const { menuButtonRef, phase, toggleMenu } = useHeaderState();
  return { menuButtonRef, phase, toggleMenu };
}
