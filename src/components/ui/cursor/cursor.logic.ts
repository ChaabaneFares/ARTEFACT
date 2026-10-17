"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURSOR_INTERACTION_EVENT,
  type CursorInteractionDetail,
} from "./cursor.effects";

const CURSOR_FOLLOW_BLEND = 0.04;
const CURSOR_REFERENCE_FRAME_MS = 1000 / 60;
const CURSOR_SETTLE_DISTANCE = 0.1;
const CURSOR_MEDIA_QUERY = "(hover: hover) and (pointer: fine)";
const CURSOR_RESTING_SCALE = 0.22;
const DEFAULT_CURSOR_INTERACTION = {
  mode: "default",
  scale: 1,
} satisfies CursorInteractionDetail;

const getFinePointerMatch = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(CURSOR_MEDIA_QUERY).matches;
};

export function useCursorTrail() {
  const secondaryCursorRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMouseOverRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const secondaryPositionRef = useRef({ x: 0, y: 0 });
  const interactionRef = useRef<CursorInteractionDetail>(
    DEFAULT_CURSOR_INTERACTION,
  );
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(CURSOR_MEDIA_QUERY);

    const updateEnabledState = () => {
      setIsEnabled(mediaQuery.matches);
    };

    updateEnabledState();
    mediaQuery.addEventListener("change", updateEnabledState);

    return () => {
      mediaQuery.removeEventListener("change", updateEnabledState);
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let lastFrameTime = performance.now();
    const schedule = () => {
      if (animationFrameRef.current === null) {
        lastFrameTime = performance.now();
        animationFrameRef.current = requestAnimationFrame(updateCursorPosition);
      }
    };
    const handleMotionChange = () => {
      reducedMotion = motionQuery.matches;
      schedule();
    };
    motionQuery.addEventListener("change", handleMotionChange);

    const handleCursorInteraction = (event: Event) => {
      const customEvent = event as CustomEvent<CursorInteractionDetail>;
      interactionRef.current = customEvent.detail ?? DEFAULT_CURSOR_INTERACTION;
      schedule();
    };

    const secondary = secondaryCursorRef.current;
    const shape = secondary?.querySelector<HTMLDivElement>(
      "[data-cursor-shape]",
    );
    const label = secondary?.querySelector<HTMLSpanElement>(
      "[data-cursor-label]",
    );
    let shapeScale = 0;
    let targetScale = 0;
    let scaleStart = 0;
    let fromScale = 0;
    const updateCursorPosition = (timestamp: number) => {
      const elapsed = Math.max(0, timestamp - lastFrameTime);
      lastFrameTime = timestamp;
      // Mouse events only update the target. Advance the existing trail once
      // per frame, preserving the original 0.04 blend at 60Hz on any display.
      const follow = reducedMotion
        ? 1
        : 1 -
          (1 - CURSOR_FOLLOW_BLEND) ** (elapsed / CURSOR_REFERENCE_FRAME_MS);
      const position = secondaryPositionRef.current;
      const target = mousePositionRef.current;
      position.x += (target.x - position.x) * follow;
      position.y += (target.y - position.y) * follow;
      const isMoving =
        Math.hypot(target.x - position.x, target.y - position.y) >
        CURSOR_SETTLE_DISTANCE;
      if (!isMoving) {
        position.x = target.x;
        position.y = target.y;
      }

      const isVisible = isMouseOverRef.current && !isMouseDownRef.current;
      const isBlendMode = interactionRef.current.mode === "blend";
      const isLabelMode = interactionRef.current.mode === "label";
      const nextScale = isVisible
        ? CURSOR_RESTING_SCALE * interactionRef.current.scale
        : 0;
      if (nextScale !== targetScale) {
        fromScale = shapeScale;
        targetScale = nextScale;
        scaleStart = timestamp;
      }
      const scaleProgress = Math.min(
        1,
        Math.max(0, (timestamp - scaleStart) / 400),
      );
      shapeScale =
        fromScale +
        (targetScale - fromScale) *
          (reducedMotion ? 1 : 1 - (1 - scaleProgress) ** 2);

      if (secondary) {
        secondary.dataset.cursorMode = interactionRef.current.mode;
        secondary.style.setProperty(
          "--cursor-label-background",
          interactionRef.current.background ?? "",
        );
        secondary.style.setProperty(
          "--cursor-label-color",
          interactionRef.current.color ?? "",
        );
        secondary.style.setProperty(
          "--cursor-label-font-size",
          `calc(${interactionRef.current.fontSize ?? "13.6px"} / ${CURSOR_RESTING_SCALE * interactionRef.current.scale})`,
        );
        secondary.style.transform = `translate3d(${secondaryPositionRef.current.x - 24}px, ${secondaryPositionRef.current.y - 24}px, 0)`;
        secondary.style.opacity = isMouseOverRef.current ? "1" : "0";
        secondary.style.mixBlendMode = isBlendMode ? "difference" : "normal";

        if (shape) shape.style.transform = `scale(${shapeScale})`;

        if (label) {
          const labelText = isLabelMode
            ? (interactionRef.current.label ?? "")
            : "";
          if (label.textContent !== labelText) {
            label.textContent = labelText;
          }
        }
      }

      animationFrameRef.current =
        !reducedMotion && (isMoving || scaleProgress < 1)
          ? requestAnimationFrame(updateCursorPosition)
          : null;
    };

    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      isMouseOverRef.current = true;
      isMouseDownRef.current = event.buttons > 0;
      schedule();
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
      schedule();
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      schedule();
    };

    const handleMouseEnter = () => {
      isMouseOverRef.current = true;
      isMouseDownRef.current = false;
      schedule();
    };

    const handleMouseLeave = () => {
      isMouseOverRef.current = false;
      isMouseDownRef.current = true;
      schedule();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener(CURSOR_INTERACTION_EVENT, handleCursorInteraction);

    if (getFinePointerMatch()) {
      schedule();
    }

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener(
        CURSOR_INTERACTION_EVENT,
        handleCursorInteraction,
      );

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
    };
  }, [isEnabled]);

  return {
    isEnabled,
    secondaryCursorRef,
  };
}
