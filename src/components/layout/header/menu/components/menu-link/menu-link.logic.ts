"use client";

import {
  activateCursorBlend,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { isSamePath } from "@/i18n/routing";
import { useHeaderState } from "../../../header.context";

export function useMenuLink(href: string) {
  const { pathname, closeMenu } = useHeaderState();
  const handleLinkEnter = () => activateCursorBlend(7.7273);
  const events = {
    "data-menu-motion": true,
    onMouseEnter: handleLinkEnter,
    onMouseLeave: clearCursorBlend,
    onFocus: handleLinkEnter,
    onBlur: clearCursorBlend,
  };
  const isCurrent = isSamePath(pathname ?? "", href);
  const current = isCurrent ? ("page" as const) : undefined;
  const navigate = isCurrent ? undefined : closeMenu;
  return { events, current, navigate };
}
