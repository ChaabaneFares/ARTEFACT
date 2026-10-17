"use client";

import { useFormState } from "../../contact-form.context";

export function useContactAttachments() {
  const state = useFormState();
  return { state };
}
