"use client";

import { type ChangeEvent, useCallback, useEffect, useRef } from "react";
import type { ContactFields } from "../../_data/contact-runtime";

export function useContactField(
  name: keyof ContactFields,
  value: string,
  onChange: (name: keyof ContactFields, value: string) => void,
  onBlur: (name: keyof ContactFields) => void,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(name, event.target.value),
    [name, onChange],
  );
  const handleBlur = useCallback(() => onBlur(name), [name, onBlur]);
  useEffect(() => {
    const field = textareaRef.current;
    if (!field || field.value !== value) return;
    const resize = () => {
      field.style.height = "auto";
      field.style.height = `${field.scrollHeight}px`;
    };
    resize();
    let previousWidth = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth === previousWidth) return;
      previousWidth = field.clientWidth;
      resize();
    });
    observer.observe(field);
    window.addEventListener("resize", resize);
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) resize();
    });
    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [value]);
  return { handleChange, handleBlur, textareaRef };
}
