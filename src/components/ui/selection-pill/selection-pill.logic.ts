"use client";

import { useCallback } from "react";
import {
  activateCursorBlend,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";

export function useSelectionPill() {
  const handleEnter = useCallback(() => activateCursorBlend(), []);
  const handleLeave = useCallback(() => clearCursorBlend(), []);
  return { handleEnter, handleLeave };
}
