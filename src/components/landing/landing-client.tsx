"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { useLandingClient } from "./landing-client.logic";

export default function LandingClient({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  useLandingClient(locale);
  return children;
}
