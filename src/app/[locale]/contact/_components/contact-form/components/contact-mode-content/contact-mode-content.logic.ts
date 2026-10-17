"use client";
import type { ContactMode } from "../../../../_data/contact-runtime";
import { useFormState } from "../../contact-form.context";
export function useContactModeContent(mode: ContactMode) {
  const state = useFormState();
  return { visible: state.mode === mode };
}
