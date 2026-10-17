"use client";

import { useCallback, useState } from "react";

export function useFaqSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fadeDismissed, setFadeDismissed] = useState(false);
  const toggle = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : id));
    setFadeDismissed(true);
  }, []);
  return { activeId, fadeDismissed, toggle };
}
