"use client";

import type { ReactNode } from "react";
import { useServiceNavigationButton } from "./service-navigation-button.logic";

export default function ServiceNavigationButton({
  targetId,
  children,
}: {
  targetId: string;
  children: ReactNode;
}) {
  const { navigate } = useServiceNavigationButton(targetId);
  return (
    <button type="button" onClick={navigate} data-page-transition-item>
      {children}
    </button>
  );
}
