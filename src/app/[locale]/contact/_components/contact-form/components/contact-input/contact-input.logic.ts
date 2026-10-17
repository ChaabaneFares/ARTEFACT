"use client";

import { useFormState } from "../../contact-form.context";

export function useContactInput() {
  const state = useFormState();
  return { state };
}
