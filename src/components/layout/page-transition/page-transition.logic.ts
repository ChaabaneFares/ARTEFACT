"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { clearCursorBlend } from "@/components/ui/cursor/cursor.effects";
import { initLenis, startLenis, stopLenis } from "@/lib/lenis";
import { pageTransitionRuntime } from "@/lib/page-transition";
import { kickScroll } from "@/lib/scrollInteraction/scrollTrigger";

const closedPath = "M 0 0 V 0 Q 50 0 100 0 V 0 z";
const powerOut = (value: number, power: number) => 1 - (1 - value) ** power;

export function usePageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const routeReadyRef = useRef<(() => void) | null>(null);
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      routeReadyRef.current?.();
    }
  }, [pathname]);

  useEffect(() => {
    let frameId = 0;
    let navigationTimer = 0;
    let recoveryTimer = 0;
    let animations: Animation[] = [];
    const overlay = overlayRef.current;
    const path = pathRef.current;
    if (!overlay || !path) return;
    const finish = () => {
      cancelAnimationFrame(frameId);
      clearTimeout(navigationTimer);
      clearTimeout(recoveryTimer);
      path.setAttribute("d", closedPath);
      delete overlay.dataset.active;
      delete document.documentElement.dataset.routeChanging;
      routeReadyRef.current = null;
      pageTransitionRuntime.active = false;
      animations.forEach((animation) => {
        animation.cancel();
      });
      animations = [];
      if (document.documentElement.dataset.menuOpen !== "true") startLenis();
    };
    const tween = (
      duration: number,
      draw: (time: number) => void,
      done: () => void,
    ) => {
      const start = performance.now();
      const tick = (now: number) => {
        const time = Math.min(duration, now - start);
        draw(time);
        if (time < duration) frameId = requestAnimationFrame(tick);
        else done();
      };
      frameId = requestAnimationFrame(tick);
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        // Changing language is a full document load, handled by the switcher.
        link.hasAttribute("data-locale-switch") ||
        (link.target && link.target !== "_self")
      )
        return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname)
        return;
      event.preventDefault();
      if (pageTransitionRuntime.active) return;
      pageTransitionRuntime.hasNavigated = true;
      pageTransitionRuntime.active = true;
      overlay.dataset.active = "true";
      document.documentElement.dataset.routeChanging = "true";
      clearCursorBlend();
      stopLenis();
      const href = `${url.pathname}${url.search}${url.hash}`;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        routeReadyRef.current = () => {
          initLenis()?.scrollTo(0, { immediate: true, force: true });
          window.scrollTo(0, 0);
          kickScroll();
          requestAnimationFrame(() => {
            const title = document.querySelector<HTMLElement>("main h1");
            title?.setAttribute("tabindex", "-1");
            title?.focus({ preventScroll: true });
          });
          finish();
        };
        router.push(href);
        recoveryTimer = window.setTimeout(finish, 10000);
        return;
      }
      animations = [
        ...document.querySelectorAll<HTMLElement>(
          "[data-page-transition-item], [data-page-transition-group]",
        ),
      ]
        .filter((item) => {
          const isGroup = item.hasAttribute("data-page-transition-group");
          const insideGroup =
            !isGroup && !!item.closest("[data-page-transition-group]");
          return window.innerWidth <= 768 ? !insideGroup : !isGroup;
        })
        .map((item, index) =>
          item.animate(
            [
              { transform: "translateY(0)" },
              { transform: "translateY(-200px)" },
            ],
            {
              duration: 680,
              delay: index * 50,
              easing: "cubic-bezier(0.333333333, 0, 0.666666667, 0)",
              fill: "forwards",
            },
          ),
        );
      let covered = false;
      let routeReady = false;
      let revealing = false;
      const reveal = () => {
        if (!covered || !routeReady || revealing) return;
        revealing = true;
        animations.forEach((animation) => {
          animation.cancel();
        });
        animations = [];
        // Reset Lenis as well as the native scroll position, behind the cover.
        initLenis()?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        kickScroll();
        requestAnimationFrame(() => {
          const title = document.querySelector<HTMLElement>("main h1");
          title?.setAttribute("tabindex", "-1");
          title?.focus({ preventScroll: true });
        });
        tween(
          688,
          (time) => {
            if (time < 188) {
              const p = (time / 188) ** 3;
              path.setAttribute(
                "d",
                `M 0 0 V ${100 - p * 50} Q 50 ${100 - p * 100} 100 ${100 - p * 50} V 0 z`,
              );
            } else {
              const p = powerOut((time - 188) / 500, 5);
              path.setAttribute(
                "d",
                `M 0 0 V ${50 * (1 - p)} Q 50 0 100 ${50 * (1 - p)} V 0 z`,
              );
            }
          },
          finish,
        );
      };
      routeReadyRef.current = () => {
        routeReady = true;
        reveal();
      };
      navigationTimer = window.setTimeout(
        () => router.push(href, { scroll: false }),
        620,
      );
      // If a route request fails, release the current page instead of trapping it.
      recoveryTimer = window.setTimeout(finish, 10000);
      tween(
        688,
        (time) => {
          if (time < 500) {
            const p = (time / 500) ** 3;
            path.setAttribute(
              "d",
              `M 0 100 V ${100 - p * 50} Q 50 ${100 - p * 100} 100 ${100 - p * 50} V 100 z`,
            );
          } else {
            const p = powerOut((time - 500) / 188, 2);
            path.setAttribute(
              "d",
              `M 0 100 V ${50 * (1 - p)} Q 50 0 100 ${50 * (1 - p)} V 100 z`,
            );
          }
        },
        () => {
          covered = true;
          reveal();
        },
      );
    };
    const preventScroll = (event: Event) => {
      if (pageTransitionRuntime.active) event.preventDefault();
    };
    const preventScrollKeys = (event: KeyboardEvent) => {
      if (
        pageTransitionRuntime.active &&
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        event.preventDefault();
    };
    window.addEventListener("popstate", finish);
    document.addEventListener("click", onClick, true);
    window.addEventListener("keydown", preventScrollKeys);
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      window.removeEventListener("popstate", finish);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", preventScrollKeys);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      finish();
    };
  }, [router]);
  return { overlayRef, pathRef };
}
