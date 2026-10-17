"use client";

import { useFormState } from "../../../../contact-form.context";

export function useContactFile(index: number) {
  const { busy, removeAttachment } = useFormState();
  const remove = () => removeAttachment(index);
  return { busy, remove };
}
