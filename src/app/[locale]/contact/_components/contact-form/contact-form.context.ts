"use client";

import { createContext, useContext } from "react";
import type { useContactForm } from "./contact-form.client.logic";

export const FormContext = createContext<ReturnType<
  typeof useContactForm
> | null>(null);
export function useFormState() {
  const state = useContext(FormContext);
  if (!state) throw new Error("Contact controls require a form");
  return state;
}
