"use client";

import { useEffect, useRef } from "react";
import {
  activateCursorLabel,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import type { HeaderCopy } from "../../../header.copy";
import { useMenuState } from "../../menu.context";
import styles from "../../menu.module.css";

export function useMenuEmail(
  email: string,
  feedback: HeaderCopy["emailFeedback"],
) {
  const { phase, setCopyStatus } = useMenuState();
  const mountedRef = useRef(true);
  const emailHoveredRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearCursorBlend();
    };
  }, []);
  useEffect(() => {
    if (phase !== "open") emailHoveredRef.current = false;
  }, [phase]);
  const handleLinkLeave = () => {
    emailHoveredRef.current = false;
    clearCursorBlend();
  };
  const showCopyCursor = (label: string) =>
    activateCursorLabel({
      label,
      color: "#000000",
      fontSize: "13.6px",
      scale: 81.6 / 10.56,
    });
  const handleEmailEnter = () => {
    emailHoveredRef.current = true;
    showCopyCursor(feedback.hover);
  };
  const handleEmailCopy = async () => {
    try {
      // The reference copies synchronously from the click's user activation.
      // Use the Clipboard API only when selection copying is unavailable.
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.className = styles.copyInput;
      const focus = document.activeElement;
      const wasHovered = emailHoveredRef.current;
      let copied = false;
      try {
        document.body.append(textarea);
        textarea.select();
        copied = document.execCommand("copy");
      } finally {
        textarea.remove();
        if (focus instanceof HTMLElement) focus.focus({ preventScroll: true });
        emailHoveredRef.current = wasHovered;
      }
      if (!copied) await navigator.clipboard.writeText(email);
      if (!mountedRef.current) return;
      setCopyStatus(feedback.copiedStatus);
      if (emailHoveredRef.current) showCopyCursor(feedback.copied);
    } catch {
      if (!mountedRef.current) return;
      setCopyStatus(feedback.unavailableStatus);
      if (emailHoveredRef.current) showCopyCursor(feedback.unavailable);
    }
  };
  return { handleEmailCopy, handleEmailEnter, handleLinkLeave };
}
