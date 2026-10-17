"use client";

import { useFormState } from "../../contact-form.context";

export function useContactFormPanel() {
  const state = useFormState();
  return { state };
}
