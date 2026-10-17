"use client";

import { useHeaderState } from "../../header.context";

export function useHeaderQuote() {
  const { hideQuoteButton, closeMenu } = useHeaderState();
  return { hideQuoteButton, closeMenu };
}
