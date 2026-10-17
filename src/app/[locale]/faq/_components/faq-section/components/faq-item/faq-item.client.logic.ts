"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  activateCursorBlend,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { useFaqState } from "../../faq-section.context";

export function useFaqItem(id: string) {
  const { activeId, toggle: onToggle } = useFaqState();
  const open = activeId === id;
  const dimmed = activeId !== null && !open;
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [answerHeight, setAnswerHeight] = useState<number>();
  const handleToggle = useCallback(() => onToggle(id), [id, onToggle]);
  const handleEnter = useCallback(() => activateCursorBlend(), []);
  const handleLeave = useCallback(() => clearCursorBlend(), []);
  useEffect(() => () => clearCursorBlend(), []);
  useEffect(() => {
    const paragraph = paragraphRef.current;
    if (!paragraph) return;
    const measure = () => {
      const margin =
        Number.parseFloat(getComputedStyle(paragraph).marginTop) || 0;
      setAnswerHeight(
        Math.round(paragraph.getBoundingClientRect().height + margin),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, []);
  const answerStyle =
    answerHeight === undefined
      ? undefined
      : ({ "--faq-answer-height": `${answerHeight}px` } as CSSProperties);
  const handleMaskRef = useCallback((node: HTMLDivElement | null) => {
    paragraphRef.current = node?.querySelector("p") ?? null;
  }, []);
  return {
    handleToggle,
    handleEnter,
    handleLeave,
    handleMaskRef,
    answerStyle,
    open,
    dimmed,
  };
}
