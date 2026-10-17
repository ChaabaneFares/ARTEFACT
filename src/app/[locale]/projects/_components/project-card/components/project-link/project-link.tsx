"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import styles from "../../project-card.module.css";
import { useProjectLink } from "./project-link.logic";

export default function ProjectLink({
  slug,
  locale,
  ariaLabel,
  name,
  cursorColor,
  image = false,
  children,
}: {
  slug: string;
  locale: Locale;
  ariaLabel?: string;
  name: string;
  cursorColor?: string;
  image?: boolean;
  children: ReactNode;
}) {
  const { enter, leave, href } = useProjectLink(
    slug,
    name,
    locale,
    cursorColor,
  );
  return (
    <Link
      prefetch={false}
      className={image ? styles.imageLink : styles.view}
      href={href}
      onMouseEnter={image ? enter : undefined}
      onMouseLeave={image ? leave : undefined}
      aria-label={image ? ariaLabel : undefined}
    >
      {children}
    </Link>
  );
}
