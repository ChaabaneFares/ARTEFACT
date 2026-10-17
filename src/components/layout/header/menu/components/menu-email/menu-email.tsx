"use client";

import type { ReactNode } from "react";
import type { HeaderCopy } from "../../../header.copy";
import styles from "../../menu.module.css";
import { useMenuEmail } from "./menu-email.logic";

export default function MenuEmail({
  email,
  label,
  feedback,
  children,
}: {
  email: string;
  label: string;
  feedback: HeaderCopy["emailFeedback"];
  children: ReactNode;
}) {
  const { handleEmailCopy, handleEmailEnter, handleLinkLeave } = useMenuEmail(
    email,
    feedback,
  );
  return (
    <button
      type="button"
      className={styles.email}
      aria-label={label}
      onClick={handleEmailCopy}
      data-menu-motion
      onMouseEnter={handleEmailEnter}
      onMouseLeave={handleLinkLeave}
      onFocus={handleEmailEnter}
      onBlur={handleLinkLeave}
    >
      {children}
    </button>
  );
}
