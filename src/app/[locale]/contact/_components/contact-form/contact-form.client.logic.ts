"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clearCursorBlend } from "@/components/ui/cursor/cursor.effects";
import type { Locale } from "@/i18n/routing";
import {
  attachmentLimits,
  type ContactErrors,
  type ContactFields,
  type ContactFormLabels,
  type ContactMode,
  studioEmail,
} from "../../_data/contact-runtime";

const emptyFields: ContactFields = { name: "", email: "", message: "" };
const validate = (
  fields: ContactFields,
  labels: ContactFormLabels,
): ContactErrors => ({
  ...(fields.name.trim().length < 2 ? { name: labels.nameError } : {}),
  ...(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim())
    ? { email: labels.emailError }
    : {}),
});

export function useContactForm(
  initialMode: ContactMode,
  locale: Locale,
  labels: ContactFormLabels,
  optionLabels: Record<string, string>,
) {
  const formRef = useRef<HTMLFormElement>(null);
  const attachmentRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestId = useRef<string | null>(null);
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [needs, setNeeds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [website, setWebsite] = useState("");
  useEffect(() => {
    setMode(location.hash === "#contact" ? "contact" : initialMode);
  }, [initialMode]);
  useEffect(
    () => () => {
      controllerRef.current?.abort();
      clearCursorBlend();
    },
    [],
  );
  const changeField = useCallback(
    (name: keyof ContactFields, value: string) => {
      setFields((current) => ({ ...current, [name]: value }));
      setErrors((current) => ({ ...current, [name]: undefined }));
      setDeliveryError("");
      requestId.current = null;
    },
    [],
  );
  const blurField = useCallback(
    (name: keyof ContactFields) => {
      setErrors((current) => ({
        ...current,
        [name]: validate(fields, labels)[name],
      }));
    },
    [fields, labels],
  );
  const toggleNeed = useCallback((label: string) => {
    setNeeds((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
    requestId.current = null;
  }, []);
  const toggleDocument = useCallback((label: string) => {
    setDocuments((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
    requestId.current = null;
  }, []);
  const toggleBudget = useCallback((label: string) => {
    setBudget((current) => (current === label ? null : label));
    requestId.current = null;
  }, []);
  const addAttachments = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      const combined = [
        ...attachments,
        ...files.filter(
          (file) =>
            !attachments.some(
              (existing) =>
                existing.name === file.name &&
                existing.size === file.size &&
                existing.lastModified === file.lastModified,
            ),
        ),
      ];
      if (
        combined.length > attachmentLimits.count ||
        combined.reduce((total, file) => total + file.size, 0) >
          attachmentLimits.bytes
      ) {
        setAttachmentError(labels.attachmentError);
      } else {
        setAttachments(combined);
        setAttachmentError("");
        requestId.current = null;
      }
      event.target.value = "";
    },
    [attachments, labels],
  );
  const removeAttachment = useCallback((index: number) => {
    setAttachments((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
    setAttachmentError("");
    requestId.current = null;
  }, []);
  const changeMode = useCallback((next: ContactMode) => {
    setMode(next);
    setDeliveryError("");
    requestId.current = null;
  }, []);
  const emailDraft = useMemo(() => {
    const lines = [
      `${labels.draftName}${labels.draftSeparator}${fields.name}`,
      `${labels.draftEmail}${labels.draftSeparator}${fields.email}`,
      "",
      fields.message,
    ];
    if (mode === "brief")
      lines.push(
        "",
        `${labels.draftNeeds}${labels.draftSeparator}${needs.map((value) => optionLabels[value]).join(labels.draftListSeparator)}`,
        `${labels.draftDocuments}${labels.draftSeparator}${documents.map((value) => optionLabels[value]).join(labels.draftListSeparator)}`,
        `${labels.draftBudget}${labels.draftSeparator}${budget ? optionLabels[budget] : labels.draftUnspecified}`,
      );
    if (attachments.length)
      lines.push(
        "",
        labels.draftAttachments,
        ...attachments.map((file) => file.name),
      );
    return `mailto:${studioEmail}?subject=${encodeURIComponent(mode === "brief" ? labels.draftBrief : labels.draftContact)}&body=${encodeURIComponent(lines.join("\n"))}`;
  }, [
    fields,
    mode,
    needs,
    documents,
    budget,
    attachments,
    labels,
    optionLabels,
  ]);
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (busy) return;
      const validation = validate(fields, labels);
      setErrors(validation);
      const firstError = Object.keys(validation)[0];
      if (firstError) {
        formRef.current
          ?.querySelector<HTMLInputElement>(`[name='${firstError}']`)
          ?.focus();
        return;
      }
      setDeliveryError("");
      setBusy(true);
      const controller = new AbortController();
      controllerRef.current = controller;
      requestId.current ??= crypto.randomUUID();
      const data = new FormData();
      for (const [key, value] of Object.entries(fields))
        data.set(key, value.trim());
      data.set("mode", mode);
      data.set("locale", locale);
      data.set("website", website);
      data.set("needs", JSON.stringify(mode === "brief" ? needs : []));
      data.set("documents", JSON.stringify(mode === "brief" ? documents : []));
      data.set("budget", mode === "brief" ? (budget ?? "") : "");
      for (const file of attachments) data.append("attachments", file);
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          body: data,
          headers: {
            "Idempotency-Key": requestId.current,
            "X-Contact-Locale": locale,
          },
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) {
          setDeliveryError(result.error || labels.deliveryError);
          return;
        }
        setSuccess(true);
        setFields(emptyFields);
        setNeeds([]);
        setDocuments([]);
        setBudget(null);
        setAttachments([]);
        requestId.current = null;
      } catch {
        if (!controller.signal.aborted) setDeliveryError(labels.deliveryError);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
        controllerRef.current = null;
      }
    },
    [
      attachments,
      budget,
      busy,
      documents,
      fields,
      mode,
      needs,
      website,
      locale,
      labels,
    ],
  );
  const closeSuccess = useCallback(() => {
    setSuccess(false);
    requestAnimationFrame(() => submitRef.current?.focus());
  }, []);
  return {
    formRef,
    attachmentRef,
    submitRef,
    mode,
    changeMode,
    fields,
    errors,
    changeField,
    blurField,
    needs,
    toggleNeed,
    documents,
    toggleDocument,
    budget,
    toggleBudget,
    attachments,
    attachmentError,
    addAttachments,
    removeAttachment,
    website,
    setWebsite,
    handleSubmit,
    busy,
    success,
    closeSuccess,
    deliveryError,
    emailDraft,
  };
}
