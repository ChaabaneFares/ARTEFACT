"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./footer.module.css";
import { useFooterButton } from "./footerButton.logic";

export default function FooterButton({
  children,
  className,
  href = "/contact",
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const { buttonRef } = useFooterButton();
  return (
    <div className={`${styles.buttonContain} cobtn-contain`}>
      <div
        className={`${styles.buttonMotion} bt-mera ${className ?? ""}`.trim()}
        data-footer-button-motion
      >
        <Link
          ref={buttonRef}
          className={`${styles.button} co-btn co-white`}
          href={href}
          data-footer-scroll-button
        >
          <span>{children}</span>
        </Link>
      </div>
    </div>
  );
}
