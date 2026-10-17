"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearCursorBlend } from "@/components/ui/cursor/cursor.effects";
import { initLenis, startLenis, stopLenis } from "@/lib/lenis";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import type { MenuPhase } from "./header.types";

export function useHeaderLogic() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<MenuPhase>("closed");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [footerActive, setFooterActive] = useState(false);
  const isPresent = phase !== "closed";
  const closeMenu = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setPhase((value) => (value === "closed" ? value : "closing"));
    clearCursorBlend();
    closeTimerRef.current = setTimeout(
      () => {
        setPhase("closed");
        closeTimerRef.current = null;
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500,
    );
  }, []);
  const toggleMenu = () => {
    if (phase === "open") {
      closeMenu();
      return;
    }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setPhase("open");
  };
  useEffect(() => {
    const lenis = initLenis();
    const sync = () => {
      // Match the reference's scroll destination, without waiting for the
      // smoothed viewport to finish catching up when returning to the top.
      const position = lenis?.isScrolling ? lenis.targetScroll : window.scrollY;
      setHasScrolled(window.innerWidth > 768 && position > 10);
    };
    sync();
    lenis?.on("scroll", sync);
    window.addEventListener("resize", sync, { passive: true });
    scrollManager.createInstance("header-desktop-links", sync, {
      useRAF: false,
    });
    return () => {
      scrollManager.removeInstance("header-desktop-links");
      lenis?.off("scroll", sync);
      window.removeEventListener("resize", sync);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);
  useEffect(() => {
    const sync = () =>
      setFooterActive(
        Boolean(
          document.querySelector(
            '[data-footer-root][data-footer-active="true"]',
          ),
        ),
      );
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      attributeFilter: ["data-footer-active"],
      subtree: true,
    });
    sync();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!isPresent) return;
    const header = headerRef.current;
    if (!header) return;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflowY;
    const previousFocus = document.activeElement;
    const siblings = [...(header.parentElement?.children ?? [])]
      .filter(
        (element): element is HTMLElement =>
          element !== header && element instanceof HTMLElement,
      )
      .map((element) => ({ element, wasInert: element.inert }));
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflowY = "hidden";
    document.documentElement.dataset.menuOpen = "true";
    siblings.forEach(({ element }) => {
      element.inert = true;
    });
    stopLenis();
    menuButtonRef.current?.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...header.querySelectorAll<HTMLElement>("a[href], button"),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.closest("[inert]") &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== "hidden",
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !header.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !header.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflowY = previousRootOverflow;
      delete document.documentElement.dataset.menuOpen;
      siblings.forEach(({ element, wasInert }) => {
        element.inert = wasInert;
      });
      clearCursorBlend();
      startLenis();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [isPresent, closeMenu]);
  return {
    headerRef,
    menuButtonRef,
    pathname,
    phase,
    hasScrolled,
    hideQuoteButton: footerActive,
    hideTopLinks: isPresent || hasScrolled,
    toggleMenu,
    closeMenu,
  };
}
