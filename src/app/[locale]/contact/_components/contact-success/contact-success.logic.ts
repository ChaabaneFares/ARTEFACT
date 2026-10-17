"use client";

import { useCallback, useEffect, useRef } from "react";

export function useContactSuccess(onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const cancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", cancel);
    dialog.showModal();
    return () => {
      dialog.removeEventListener("cancel", cancel);
      dialog.close();
    };
  }, [onClose]);
  return { dialogRef, close };
}
