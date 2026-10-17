"use client";

import { useEffect, useRef, useState } from "react";
import { clearCursorBlend } from "@/components/ui/cursor/cursor.effects";
import { useHeaderState } from "../header.context";

export function useMenuLogic() {
  const { phase, closeMenu } = useHeaderState();
  const menuRef = useRef<HTMLDivElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  useEffect(() => {
    if (phase === "open") return;
    clearCursorBlend();
    setCopyStatus("");
  }, [phase]);
  useEffect(() => {
    const root = menuRef.current;
    if (phase !== "open" || !root) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void import("./menu.animate")
      .then(({ mountMenuMotion }) => {
        if (!cancelled) cleanup = mountMenuMotion(root);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [phase]);
  return { phase, closeMenu, copyStatus, setCopyStatus, menuRef };
}
