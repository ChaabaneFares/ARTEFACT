"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../../menu.module.css";
import { useMenuLink } from "./menu-link.logic";

export default function MenuLink({
  href,
  social = false,
  children,
}: {
  href: string;
  social?: boolean;
  children: ReactNode;
}) {
  const { events, current, navigate } = useMenuLink(href);
  return social ? (
    <a
      className={styles.socialLink}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...events}
    >
      {children}
    </a>
  ) : (
    <Link href={href} aria-current={current} onClick={navigate} {...events}>
      {children}
    </Link>
  );
}
