"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { isSamePath } from "@/i18n/routing";

import { useHeaderTopLink } from "./header-top-link.logic";

export default function HeaderTopLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const { pathname } = useHeaderTopLink();
  return (
    <Link
      href={href}
      aria-current={isSamePath(pathname ?? "", href) ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
