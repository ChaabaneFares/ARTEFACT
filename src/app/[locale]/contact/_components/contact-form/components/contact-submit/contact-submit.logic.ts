"use client";

import {
  activateCursorBlend,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { useFormState } from "../../contact-form.context";

export function useContactSubmit(label: string, sending: string) {
  const state = useFormState();
  const text = state.busy ? sending : label;
  const handleSubmitEnter = () => activateCursorBlend();
  const handleSubmitLeave = () => clearCursorBlend();
  return { state, text, handleSubmitEnter, handleSubmitLeave };
}
