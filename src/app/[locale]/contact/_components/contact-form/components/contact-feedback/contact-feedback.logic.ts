"use client";

import type { ChangeEvent } from "react";
import { useFormState } from "../../contact-form.context";

export function useContactFeedback() {
  const state = useFormState();
  const handleWebsiteChange = (event: ChangeEvent<HTMLInputElement>) =>
    state.setWebsite(event.target.value);
  return { state, handleWebsiteChange };
}
