"use client";

import { useFormState } from "../../contact-form.context";

export function useContactAttachmentButton() {
  const state = useFormState();
  const openAttachments = () => state.attachmentRef.current?.click();
  return { state, openAttachments };
}
