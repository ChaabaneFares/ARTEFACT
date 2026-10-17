"use client";

import type { ContactFields } from "../../../../_data/contact-runtime";
import ContactField from "../../../contact-field/contact-field";

import { useContactInput } from "./contact-input.logic";

export default function ContactInput({
  name,
  label,
}: {
  name: keyof ContactFields;
  label: string;
}) {
  const { state } = useContactInput();
  return (
    <ContactField
      name={name}
      label={label}
      value={state.fields[name]}
      error={state.errors[name]}
      disabled={state.busy}
      onChange={state.changeField}
      onBlur={state.blurField}
    />
  );
}
