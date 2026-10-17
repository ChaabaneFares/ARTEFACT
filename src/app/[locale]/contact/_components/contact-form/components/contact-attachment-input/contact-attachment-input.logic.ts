"use client";

import { useFormState } from "../../contact-form.context";

export function useContactAttachmentInput() {
  const state = useFormState();
  return { state };
}
