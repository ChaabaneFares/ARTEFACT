import { type RefObject, useEffect, useId, useRef, useState } from "react";
import scrollManager from "@/lib/scrollInteraction/scrollManager";

type UseScenePaintVisibilityOptions = {
  enabled?: boolean;
  targetRef: RefObject<HTMLElement | null>;
};

const SCENE_PAINT_VISIBILITY_SCROLL_PREFIX = "scene-paint-visibility";

function isInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return rect.bottom > 0 && rect.top < window.innerHeight;
}

/**
 * Tracks whether a 3D scene is on screen, so off-screen canvases can be
 * parked (display:none) while on-screen ones keep painting. Scenes are never
 * parked while visible: measurement showed several manual-render canvases
 * painting together costs nothing, and hiding a visible one blanks a section.
 */
export function useScenePaintVisibility({
  enabled = true,
  targetRef,
}: UseScenePaintVisibilityOptions) {
  const [isPaintVisible, setIsPaintVisible] = useState(false);
  const scrollInstanceId = `${SCENE_PAINT_VISIBILITY_SCROLL_PREFIX}-${useId().replace(/:/g, "")}`;
  const frameRef = useRef<number | null>(null);
  const latestValueRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      latestValueRef.current = false;
      setIsPaintVisible(false);
      return;
    }

    const syncVisibility = () => {
      frameRef.current = null;

      const element = targetRef.current;
      const nextValue = element ? isInViewport(element) : false;

      if (latestValueRef.current === nextValue) {
        return;
      }

      latestValueRef.current = nextValue;
      setIsPaintVisible(nextValue);
    };

    const scheduleSync = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(syncVisibility);
    };

    syncVisibility();
    scrollManager.createInstance(scrollInstanceId, scheduleSync, {
      useRAF: false,
    });
    window.addEventListener("resize", scheduleSync);

    return () => {
      scrollManager.removeInstance(scrollInstanceId);
      window.removeEventListener("resize", scheduleSync);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, scrollInstanceId, targetRef]);

  return isPaintVisible;
}
