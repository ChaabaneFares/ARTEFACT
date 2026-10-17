"use client";

import {
  memo,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { throttle } from "@/utils/control/throttle";
import type { ScrollableContainerThumbIdleMode } from "./scrollable-container";
import styles from "./scrollable-container.module.css";
import { observeScrollableContent } from "./scrollable-container-content-observer";

interface ScrollableContainerScrollbarProps {
  containerRef: RefObject<HTMLDivElement | null>;
  useWindowScroll: boolean;
  isDesktopViewport: boolean;
  thumbIdleMode?: ScrollableContainerThumbIdleMode;
}

const MIN_CUSTOM_SCROLLBAR_OVERFLOW_PX = 12;

function ScrollableContainerScrollbar({
  containerRef,
  useWindowScroll,
  isDesktopViewport,
  thumbIdleMode = "hidden",
}: ScrollableContainerScrollbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const scrollingTimeoutRef = useRef<number | null>(null);
  const thumbClickOffsetRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const thumbHeightRef = useRef(30);
  const thumbPositionRef = useRef(0);
  const shouldShowIdleThumb =
    thumbIdleMode === "thin-visible" &&
    isScrollable &&
    !isVisible &&
    !isDragging &&
    !isScrolling &&
    !isHovering;

  const getScrollElement = useCallback(() => {
    if (useWindowScroll) {
      if (typeof document === "undefined") {
        return null;
      }
      return (document.scrollingElement ||
        document.documentElement) as HTMLElement | null;
    }
    return containerRef.current;
  }, [useWindowScroll, containerRef]);

  const showScrollbar = useCallback(() => {
    if (!isDesktopViewport) {
      return;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
  }, [isDesktopViewport]);

  const scheduleHideScrollbar = useCallback(
    (delay = 600) => {
      if (isDragging || isScrolling || isHovering) {
        return;
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = window.setTimeout(() => {
        if (!isDragging && !isScrolling && !isHovering) {
          setIsVisible(false);
        }
      }, delay);
    },
    [isDragging, isScrolling, isHovering],
  );

  const applyThumbGeometry = useCallback((height: number, position: number) => {
    thumbHeightRef.current = height;
    thumbPositionRef.current = position;

    if (thumbRef.current) {
      thumbRef.current.style.height = `${height}%`;
      thumbRef.current.style.transform = `translateY(${position}px)`;
    }
  }, []);

  const hideScrollbar = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  const detectScrolling = useCallback(() => {
    const container = getScrollElement();
    if (!container) {
      return;
    }

    if (container.scrollTop !== prevScrollTopRef.current) {
      prevScrollTopRef.current = container.scrollTop;
      setIsScrolling(true);

      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }

      scrollingTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    }
  }, [getScrollElement]);

  const updateScrollbar = useCallback(() => {
    const container = getScrollElement();
    if (!isDesktopViewport || !container) {
      setIsScrollable(false);
      return;
    }

    const overflowHeight = Math.max(
      container.scrollHeight - container.clientHeight,
      0,
    );
    const isContainerScrollable =
      overflowHeight > MIN_CUSTOM_SCROLLBAR_OVERFLOW_PX;

    setIsScrollable((previous) =>
      previous === isContainerScrollable ? previous : isContainerScrollable,
    );
    detectScrolling();

    if (isContainerScrollable) {
      const scrollRatio =
        container.scrollTop / (container.scrollHeight - container.clientHeight);
      const viewportRatio = container.clientHeight / container.scrollHeight;
      const calculatedThumbHeight = Math.max(30, viewportRatio * 100);
      const calculatedThumbPosition =
        scrollRatio *
        (container.clientHeight -
          (container.clientHeight * calculatedThumbHeight) / 100);

      applyThumbGeometry(calculatedThumbHeight, calculatedThumbPosition);
    } else {
      applyThumbGeometry(30, 0);
      hideScrollbar();
    }
  }, [
    applyThumbGeometry,
    detectScrolling,
    getScrollElement,
    hideScrollbar,
    isDesktopViewport,
  ]);

  const throttledUpdateScrollbar = useMemo(
    () => throttle(updateScrollbar, 20),
    [updateScrollbar],
  );

  const calculateScrollPositionFromMouse = useCallback(
    (clientY: number, containerRect: DOMRect) => {
      const container = getScrollElement();
      if (!container) {
        return 0;
      }
      const trackHeight = containerRect.height;
      const thumbHeightPx = (thumbHeightRef.current / 100) * trackHeight;
      const availableTrackHeight = trackHeight - thumbHeightPx;

      const relativeY = clientY - containerRect.top;
      const adjustedY = Math.max(
        0,
        Math.min(relativeY - thumbClickOffsetRef.current, availableTrackHeight),
      );

      const scrollRatio = adjustedY / availableTrackHeight;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      return Math.max(0, Math.min(scrollRatio * scrollHeight, scrollHeight));
    },
    [getScrollElement],
  );

  const startDrag = useCallback(
    (event: ReactMouseEvent | ReactTouchEvent) => {
      const scrollElement = getScrollElement();
      if (!isScrollable || !scrollElement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const containerRect =
        trackRef.current?.getBoundingClientRect() ??
        (event.currentTarget as HTMLElement).getBoundingClientRect();
      const targetElement = event.currentTarget as HTMLElement;
      const isThumbClicked = targetElement.classList.contains(
        styles.scrollbarThumb,
      );

      const clientY =
        "clientY" in event ? event.clientY : event.touches[0].clientY;

      if (isThumbClicked) {
        const thumbRect = targetElement.getBoundingClientRect();
        thumbClickOffsetRef.current = clientY - thumbRect.top;
      } else {
        thumbClickOffsetRef.current =
          ((thumbHeightRef.current / 100) * containerRect.height) / 2;

        const clickRatio = (clientY - containerRect.top) / containerRect.height;
        const scrollHeight =
          scrollElement.scrollHeight - scrollElement.clientHeight;
        scrollElement.scrollTop = clickRatio * scrollHeight;
        updateScrollbar();
        return;
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      setIsDragging(true);
      setIsVisible(true);
      document.body.style.userSelect = "none";

      if (thumbRef.current) {
        thumbRef.current.classList.add(styles.dragging);
      }

      const onDrag = (dragEvent: MouseEvent | TouchEvent) => {
        const currentClientY =
          "clientY" in dragEvent
            ? dragEvent.clientY
            : dragEvent.touches[0].clientY;
        scrollElement.scrollTop = calculateScrollPositionFromMouse(
          currentClientY,
          containerRect,
        );
        updateScrollbar();
      };

      const stopDrag = () => {
        setIsDragging(false);
        document.body.style.userSelect = "";

        if (thumbRef.current) {
          thumbRef.current.classList.remove(styles.dragging);
        }

        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("touchmove", onDrag);
        document.removeEventListener("mouseup", stopDrag);
        document.removeEventListener("touchend", stopDrag);
        document.removeEventListener("touchcancel", stopDrag);

        scheduleHideScrollbar(300);
      };

      document.addEventListener("mousemove", onDrag);
      document.addEventListener("touchmove", onDrag);
      document.addEventListener("mouseup", stopDrag);
      document.addEventListener("touchend", stopDrag);
      document.addEventListener("touchcancel", stopDrag);
    },
    [
      calculateScrollPositionFromMouse,
      getScrollElement,
      isScrollable,
      scheduleHideScrollbar,
      updateScrollbar,
    ],
  );

  const handleMouseEnter = useCallback(() => {
    if (!isDesktopViewport || !isScrollable) {
      return;
    }
    setIsHovering(true);
    showScrollbar();
  }, [isDesktopViewport, isScrollable, showScrollbar]);

  const handleMouseLeave = useCallback(() => {
    if (!isDesktopViewport) {
      return;
    }
    setIsHovering(false);

    if (!isDragging && !isScrolling) {
      scheduleHideScrollbar(300);
    }
  }, [isDesktopViewport, isDragging, isScrolling, scheduleHideScrollbar]);

  useEffect(() => {
    if (isDragging || isScrolling || isHovering) {
      showScrollbar();
    } else if (isScrollable) {
      scheduleHideScrollbar();
    } else {
      hideScrollbar();
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [
    hideScrollbar,
    isDragging,
    isHovering,
    isScrollable,
    isScrolling,
    scheduleHideScrollbar,
    showScrollbar,
  ]);

  useEffect(() => {
    if (
      !useWindowScroll ||
      !isDesktopViewport ||
      typeof document === "undefined"
    ) {
      return;
    }

    const root = document.documentElement;
    root.classList.add("custom-scrollbar");

    return () => {
      root.classList.remove("custom-scrollbar");
    };
  }, [isDesktopViewport, useWindowScroll]);

  useEffect(() => {
    const container = getScrollElement();
    if (!container) {
      return;
    }

    let initialMeasureTimeout: number | null = null;
    let cancelled = false;

    if (isDesktopViewport) {
      updateScrollbar();
      initialMeasureTimeout = window.setTimeout(updateScrollbar, 100);

      if (typeof document !== "undefined" && "fonts" in document) {
        void document.fonts.ready.then(() => {
          if (!cancelled) {
            updateScrollbar();
          }
        });
      }
    }

    const scrollHandler = isDesktopViewport
      ? throttledUpdateScrollbar
      : undefined;

    if (scrollHandler) {
      if (useWindowScroll) {
        window.addEventListener("scroll", scrollHandler as EventListener, {
          passive: true,
        });
        window.addEventListener("resize", scrollHandler as EventListener, {
          passive: true,
        });
      } else {
        container.addEventListener("scroll", scrollHandler as EventListener, {
          passive: true,
        });
      }
    }

    const stopObservingContent = !isDesktopViewport
      ? null
      : observeScrollableContent({
          root: containerRef.current,
          onChange: throttledUpdateScrollbar,
        });

    return () => {
      if (scrollHandler) {
        if (useWindowScroll) {
          window.removeEventListener("scroll", scrollHandler as EventListener);
          window.removeEventListener("resize", scrollHandler as EventListener);
        } else {
          container.removeEventListener(
            "scroll",
            scrollHandler as EventListener,
          );
        }
      }
      stopObservingContent?.();
      throttledUpdateScrollbar.cancel();

      if (initialMeasureTimeout !== null) {
        window.clearTimeout(initialMeasureTimeout);
      }
      cancelled = true;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [
    containerRef,
    getScrollElement,
    isDesktopViewport,
    throttledUpdateScrollbar,
    updateScrollbar,
    useWindowScroll,
  ]);

  return (
    <>
      <div
        ref={trackRef}
        className={`${styles.scrollbarTrack} ${
          isScrollable && isVisible ? styles.visible : ""
        }`}
        aria-hidden="true"
        onMouseDown={startDrag}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <div
        ref={thumbRef}
        className={[
          styles.scrollbarThumb,
          isScrollable && (isVisible || shouldShowIdleThumb)
            ? styles.visible
            : "",
          isScrollable && isVisible ? styles.expanded : "",
          isDragging ? styles.dragging : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          height: `${thumbHeightRef.current}%`,
          transform: `translateY(${thumbPositionRef.current}px)`,
        }}
        aria-hidden="true"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      <div
        className={`${styles.scrollbarHandle} ${
          !isScrollable ? styles.disabled : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        aria-hidden="true"
        style={{
          pointerEvents: isScrollable ? "auto" : "none",
        }}
      />
    </>
  );
}

export default memo(ScrollableContainerScrollbar);
