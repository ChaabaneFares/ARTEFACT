"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "../../menu.module.css";
import { useMenuEstimate } from "./menu-estimate.logic";

export default function MenuEstimate({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { closeMenu } = useMenuEstimate();
  return (
    <Link className={styles.estimate} href={href} onClick={closeMenu}>
      {children}
    </Link>
  );
}
