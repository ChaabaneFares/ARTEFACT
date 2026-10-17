"use client";

import type { ContactFields } from "../../_data/contact-runtime";
import { useContactField } from "./contact-field.logic";
import styles from "./contact-field.module.css";

type ContactFieldProps = {
  name: keyof ContactFields;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (name: keyof ContactFields, value: string) => void;
  onBlur: (name: keyof ContactFields) => void;
};

export default function ContactField({
  name,
  label,
  value,
  error,
  disabled,
  onChange,
  onBlur,
}: ContactFieldProps) {
  const { handleChange, handleBlur, textareaRef } = useContactField(
    name,
    value,
    onChange,
    onBlur,
  );
  const props = {
    id: `contact-${name}`,
    name,
    placeholder: label,
    value,
    disabled,
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-label": label,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `contact-${name}-error` : undefined,
  };
  return (
    <div
      className={styles.field}
      data-field={name}
      data-invalid={Boolean(error)}
    >
      <div className={styles.control}>
        {name === "message" ? (
          <textarea {...props} ref={textareaRef} rows={1} maxLength={10000} />
        ) : (
          <input
            {...props}
            type={name === "email" ? "email" : "text"}
            autoComplete={name === "email" ? "email" : "name"}
            maxLength={name === "email" ? 254 : 120}
            required
          />
        )}
        <div className={styles.line} aria-hidden="true">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
          >
            <path
              fill="none"
              stroke={error ? "#ff6666" : "#5a81a2"}
              d="M0,56.5c0,0,298.666,0,399.333,0C448.336,56.5,513.994,46,597,46c77.327,0,135,10.5,200.999,10.5c95.996,0,402.001,0,402.001,0"
            />
          </svg>
        </div>
      </div>
      {name !== "message" && (
        <span
          id={`contact-${name}-error`}
          className={styles.error}
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}
