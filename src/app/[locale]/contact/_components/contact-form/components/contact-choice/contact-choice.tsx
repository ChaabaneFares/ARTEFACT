"use client";

import SelectionPill from "@/components/ui/selection-pill/selection-pill";
import styles from "../../contact-form.module.css";
import { useContactChoice } from "./contact-choice.logic";

export default function ContactChoice({
  group,
  label,
  value,
}: {
  group: "needs" | "documents" | "budget";
  label: string;
  value: string;
}) {
  const { state, pressed, select } = useContactChoice(group, value);
  return (
    <SelectionPill
      label={label}
      pressed={pressed}
      onClick={select}
      className={styles.pill}
      disabled={state.busy}
    />
  );
}
