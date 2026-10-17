"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  activateCursorLabel,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { studioEmail } from "../../_data/contact-runtime";

export type ContactEmailLabels = {
  emailCopied: string;
  copied: string;
  click: string;
  email: string;
};

export function useContactInfo(labels: ContactEmailLabels) {
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(studioEmail);
      setStatus(labels.emailCopied);
      activateCursorLabel({ label: labels.copied });
    } catch {
      setStatus(`${labels.email}${studioEmail}`);
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(""), 2500);
  }, [labels]);
  const handleEnter = useCallback(
    () => activateCursorLabel({ label: labels.click }),
    [labels],
  );
  const handleLeave = useCallback(() => clearCursorBlend(), []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      clearCursorBlend();
    },
    [],
  );
  return { copyEmail, handleEnter, handleLeave, status };
}
