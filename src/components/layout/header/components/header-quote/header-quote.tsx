"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../../header.module.css";
import { useHeaderQuote } from "./header-quote.logic";

export default function HeaderQuote({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { hideQuoteButton, closeMenu } = useHeaderQuote();
  return (
    <Link
      className={styles.quoteButton}
      data-hidden={hideQuoteButton}
      inert={hideQuoteButton}
      href={href}
      onClick={closeMenu}
    >
      {children}
    </Link>
  );
}
