"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  activateCursorBlend,
  activateCursorLabel,
  clearCursorBlend,
} from "@/components/ui/cursor/cursor.effects";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import scrollManager from "@/lib/scrollInteraction/scrollManager";
import {
  createRAFBatch,
  createStateTracker,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";

const FOOTER_ROOT_SELECTOR = "[data-footer-root]";
const FOOTER_TRIG_SELECTOR = "[data-footer-trig]";
const FOOTER_BACKGROUND_SELECTOR = "[data-footer-background]";
const FOOTER_CONTENT_SELECTOR = "[data-footer-content]";
const FOOTER_HEADLINE_SELECTOR = "[data-footer-headline]";
const FOOTER_TABS_SELECTOR = "[data-footer-tabs]";
const FOOTER_SCROLL_BUTTON_SELECTOR = "[data-footer-scroll-button]";
const FOOTER_CURSOR_SELECTOR = "[data-footer-cursor]";
const FOOTER_EMAIL_SELECTOR = "[data-footer-email]";
const FOOTER_COPY_STATUS_SELECTOR = "[data-footer-copy-status]";
const MOBILE_BREAKPOINT = 768;
const SOURCE_TRIGGER_OFFSET = 0.08;
const SOURCE_REVEAL_DURATION = 1000;
const SOURCE_TABS_SPEED = 0.08;
const FOOTER_COPY_CURSOR_SCALE = 81.6 / 10.56;
const FOOTER_COPY_CURSOR_FONT_SIZE = "13.6px";

const rafBatch = createRAFBatch();
const styleSetter = createBatchStyleSetter();
const stateTracker = createStateTracker();

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function easePowerOut(value: number): number {
  return 1 - (1 - value) ** 2;
}

function formatPx(value: number): string {
  return `${Number(value.toFixed(3)).toString()}px`;
}

type FooterGeometry = {
  top: number;
  height: number;
  viewportHeight: number;
  mobile: boolean;
};

function resolveSourceStartDistance(geometry: FooterGeometry): number {
  const top = geometry.top - window.scrollY;
  const viewportPoint = geometry.viewportHeight * (0.5 - SOURCE_TRIGGER_OFFSET);
  return (
    top +
    geometry.height *
      (geometry.mobile ? -SOURCE_TRIGGER_OFFSET : 0.5 - SOURCE_TRIGGER_OFFSET) -
    viewportPoint
  );
}

function copyTextWithTextarea(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function writeTextWithFallback(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      copyTextWithTextarea(text);
      return;
    }
  }

  copyTextWithTextarea(text);
}

export function useFooterAnimation() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(FOOTER_ROOT_SELECTOR);

    if (!root) {
      return;
    }

    const trig = root.querySelector<HTMLElement>(FOOTER_TRIG_SELECTOR);
    const background = root.querySelector<HTMLElement>(
      FOOTER_BACKGROUND_SELECTOR,
    );
    const contentGroups = Array.from(
      root.querySelectorAll<HTMLElement>(FOOTER_CONTENT_SELECTOR),
    );
    const headline = root.querySelector<HTMLElement>(FOOTER_HEADLINE_SELECTOR);
    const tabs = root.querySelector<HTMLElement>(FOOTER_TABS_SELECTOR);
    const scrollButtons = Array.from(
      root.querySelectorAll<HTMLElement>(FOOTER_SCROLL_BUTTON_SELECTOR),
    );
    const cursorTargets = Array.from(
      root.querySelectorAll<HTMLElement>(FOOTER_CURSOR_SELECTOR),
    );
    const emailButton = root.querySelector<HTMLElement>(FOOTER_EMAIL_SELECTOR);
    const copyStatus = root.querySelector<HTMLElement>(
      FOOTER_COPY_STATUS_SELECTOR,
    );
    const scrollKey = `footer-reveal-${pathname}`;
    let revealProgress = 0;
    let backgroundProgress = 0;
    let entered = false;
    let triggered = false;
    let tweenFrame = 0;
    let tabsMiddle = 0;
    let tabsHeight = 0;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let contentTween: { from: number; to: number; start: number } | null = null;
    let backgroundTween: { from: number; to: number; start: number } | null =
      null;
    let lastTabsY: number | null = null;

    if (!trig) {
      return;
    }

    const geometry: FooterGeometry = {
      top: 0,
      height: 0,
      viewportHeight: window.innerHeight,
      mobile: window.innerWidth <= MOBILE_BREAKPOINT,
    };
    let disposed = false;
    const measure = () => {
      const rect = root.getBoundingClientRect();
      geometry.top = rect.top + window.scrollY;
      geometry.height = rect.height;
      geometry.viewportHeight = window.innerHeight;
      geometry.mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (tabs) {
        const tabRect = tabs.getBoundingClientRect();
        tabsHeight = tabRect.height;
        tabsMiddle =
          tabRect.top + window.scrollY + tabRect.height / 2 - (lastTabsY ?? 0);
      }
      scheduleFooterUpdate();
    };

    const renderReveal = () => {
      const isVisible = revealProgress > 0;
      const opacity = Number(revealProgress.toFixed(4)).toString();
      stateTracker.trackAttribute(
        trig,
        "data-footer-visible",
        isVisible ? "true" : "false",
      );
      styleSetter.set(trig, "opacity", opacity);
      styleSetter.set(trig, "visibility", isVisible ? "visible" : "hidden");
      styleSetter.set(trig, "pointerEvents", isVisible ? "auto" : "none");
      if (background) {
        styleSetter.set(
          background,
          "opacity",
          Number(backgroundProgress.toFixed(4)).toString(),
        );
        styleSetter.set(
          background,
          "visibility",
          backgroundProgress > 0 ? "visible" : "hidden",
        );
      }
    };
    const tickReveal = (now: number) => {
      if (disposed) return;
      if (contentTween) {
        const progress = reducedMotion
          ? 1
          : clamp01((now - contentTween.start) / SOURCE_REVEAL_DURATION);
        revealProgress =
          contentTween.from +
          (contentTween.to - contentTween.from) * easePowerOut(progress);
        if (progress === 1) contentTween = null;
      }
      if (backgroundTween) {
        const progress = reducedMotion
          ? 1
          : clamp01((now - backgroundTween.start) / SOURCE_REVEAL_DURATION);
        backgroundProgress =
          backgroundTween.from +
          (backgroundTween.to - backgroundTween.from) * easePowerOut(progress);
        if (progress === 1) backgroundTween = null;
      }
      renderReveal();
      tweenFrame =
        contentTween || backgroundTween ? requestAnimationFrame(tickReveal) : 0;
    };
    const updateFooter = () => {
      const inside = resolveSourceStartDistance(geometry) <= 0;
      stateTracker.trackAttribute(
        root,
        "data-footer-active",
        inside ? "true" : "false",
      );
      if (inside !== entered) {
        entered = inside;
        const now = performance.now();
        backgroundTween = {
          from: backgroundProgress,
          to: inside ? 1 : 0,
          start: now,
        };
        // The source plays the content reveal once. Only its background reverses
        // when the user scrolls back above the boundary.
        if (inside && !triggered) {
          triggered = true;
          contentTween = { from: revealProgress, to: 1, start: now };
        }
        cancelAnimationFrame(tweenFrame);
        tickReveal(now);
      }
      const tabsInView =
        tabsMiddle - tabsHeight / 2 <=
          window.scrollY + geometry.viewportHeight &&
        tabsMiddle + tabsHeight / 2 >= window.scrollY;
      if (tabs && !geometry.mobile && (tabsInView || reducedMotion)) {
        const tabsY = reducedMotion
          ? 0
          : (tabsMiddle - window.scrollY - geometry.viewportHeight / 2) *
            SOURCE_TABS_SPEED;
        if (lastTabsY === null || Math.abs(tabsY - lastTabsY) >= 0.005) {
          lastTabsY = tabsY;
          styleSetter.set(
            tabs,
            "transform",
            `translate3d(0, ${formatPx(tabsY)}, 0)`,
          );
        }
      }
    };
    const handleMotionChange = () => {
      reducedMotion = motionQuery.matches;
      cancelAnimationFrame(tweenFrame);
      tickReveal(performance.now());
      scheduleFooterUpdate();
    };
    motionQuery.addEventListener("change", handleMotionChange);

    const scheduleFooterUpdate = () => {
      rafBatch.schedule(scrollKey, updateFooter);
    };

    const handleCursorEnter = () => {
      activateCursorBlend();
    };

    const handleCursorLeave = () => {
      clearCursorBlend();
    };

    const activateCopyCursor = (label: string) => {
      activateCursorLabel({
        background: "#ffffff",
        color: "#3d7299",
        fontSize: FOOTER_COPY_CURSOR_FONT_SIZE,
        label,
        scale: FOOTER_COPY_CURSOR_SCALE,
      });
    };

    // The labels are rendered on the button in the page's language.
    const copyLabels = emailButton?.dataset;

    const handleEmailCursorEnter = () => {
      activateCopyCursor(copyLabels?.copyHover ?? "");
    };

    const handleEmailCursorLeave = () => {
      clearCursorBlend();
    };

    const handleEmailClick = () => {
      if (!emailButton) {
        return;
      }

      const value =
        emailButton.dataset.copyValue ?? emailButton.textContent ?? "";
      const normalizedValue = value.trim();

      if (!normalizedValue) {
        return;
      }

      void writeTextWithFallback(normalizedValue)
        .then(() => {
          activateCopyCursor(copyLabels?.copyDone ?? "");
          if (copyStatus) {
            copyStatus.textContent = copyLabels?.copyDone ?? "";
          }
        })
        .catch(() => {
          activateCopyCursor(copyLabels?.copyFailed ?? "");
          if (copyStatus) {
            copyStatus.textContent = copyLabels?.copyUnavailable ?? "";
          }
        });
    };

    window.addEventListener("resize", measure, { passive: true });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);
    if (root.parentElement) resizeObserver.observe(root.parentElement);
    void document.fonts.ready.then(() => {
      if (!disposed) measure();
    });
    scrollManager.createInstance(scrollKey, scheduleFooterUpdate, {
      useRAF: false,
    });

    cursorTargets.forEach((target) => {
      target.addEventListener("mouseenter", handleCursorEnter);
      target.addEventListener("mouseleave", handleCursorLeave);
    });

    emailButton?.addEventListener("mouseenter", handleEmailCursorEnter);
    emailButton?.addEventListener("mousemove", handleEmailCursorEnter);
    emailButton?.addEventListener("mouseleave", handleEmailCursorLeave);
    emailButton?.addEventListener("click", handleEmailClick);

    measure();
    kickScroll();

    return () => {
      disposed = true;
      cancelAnimationFrame(tweenFrame);
      motionQuery.removeEventListener("change", handleMotionChange);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
      scrollManager.removeInstance(scrollKey);
      rafBatch.cancel(scrollKey);
      styleSetter.set(trig, "opacity", "");
      styleSetter.set(trig, "visibility", "");
      styleSetter.set(trig, "pointerEvents", "");
      styleSetter.set(trig, "transform", "");
      trig.removeAttribute("data-footer-visible");
      root.removeAttribute("data-footer-active");
      stateTracker.clear(root);
      stateTracker.clear(trig);
      if (background) {
        styleSetter.set(background, "opacity", "");
        styleSetter.set(background, "visibility", "");
      }
      contentGroups.forEach((group) => {
        styleSetter.set(group, "transform", "");
      });
      if (headline) {
        styleSetter.set(headline, "transform", "");
        styleSetter.set(headline, "opacity", "");
      }
      scrollButtons.forEach((button) => {
        styleSetter.set(button, "transform", "");
        styleSetter.set(button, "opacity", "");
      });
      if (tabs) {
        styleSetter.set(tabs, "transform", "");
        stateTracker.trackClassToggle(tabs, "revealed", false);
        stateTracker.clear(tabs);
      }
      cursorTargets.forEach((target) => {
        target.removeEventListener("mouseenter", handleCursorEnter);
        target.removeEventListener("mouseleave", handleCursorLeave);
      });
      emailButton?.removeEventListener("mouseenter", handleEmailCursorEnter);
      emailButton?.removeEventListener("mousemove", handleEmailCursorEnter);
      emailButton?.removeEventListener("mouseleave", handleEmailCursorLeave);
      emailButton?.removeEventListener("click", handleEmailClick);
      clearCursorBlend();
    };
  }, [pathname]);
}
