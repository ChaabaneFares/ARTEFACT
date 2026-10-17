"use client";

import type { KeyboardEvent } from "react";
import { useFormState } from "../../contact-form.context";

export function useContactTabs() {
  const state = useFormState();
  const handleTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      state.busy ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "brief"
        : event.key === "End"
          ? "contact"
          : state.mode === "brief"
            ? "contact"
            : "brief";
    state.changeMode(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-mode='${next}']`)
      ?.focus();
  };
  return { handleTabKey };
}
