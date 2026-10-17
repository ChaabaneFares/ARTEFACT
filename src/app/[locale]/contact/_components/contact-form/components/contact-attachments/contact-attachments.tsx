"use client";

import styles from "../../contact-form.module.css";
import ContactFile from "./components/contact-file/contact-file";
import { useContactAttachments } from "./contact-attachments.logic";

export default function ContactAttachments({
  removeLabel,
}: {
  removeLabel: string;
}) {
  const { state } = useContactAttachments();
  return (
    <>
      <ul
        className={styles.fileList}
        aria-hidden={state.attachments.length === 0}
      >
        {state.attachments.map((file, index) => (
          <ContactFile
            key={`${file.name}-${file.lastModified}-${file.size}`}
            file={file}
            removeLabel={removeLabel}
            index={index}
          />
        ))}
      </ul>
      {state.attachmentError && (
        <p className={styles.error} role="alert">
          {state.attachmentError}
        </p>
      )}
    </>
  );
}
