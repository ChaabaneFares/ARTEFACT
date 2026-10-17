"use client";

import { useFormState } from "../../contact-form.context";

export function useContactChoice(
  group: "needs" | "documents" | "budget",
  label: string,
) {
  const state = useFormState();
  const pressed =
    group === "budget" ? state.budget === label : state[group].includes(label);
  const toggle =
    group === "needs"
      ? state.toggleNeed
      : group === "documents"
        ? state.toggleDocument
        : state.toggleBudget;
  const select = () => toggle(label);
  return { state, pressed, select };
}
