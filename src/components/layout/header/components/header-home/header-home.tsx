"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../../header.module.css";
import { useHeaderHome } from "./header-home.logic";

export default function HeaderHome({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { closeMenu } = useHeaderHome();
  return (
    <Link className={styles.logoLink} href={href} onClick={closeMenu}>
      {children}
    </Link>
  );
}
