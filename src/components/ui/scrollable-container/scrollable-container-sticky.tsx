"use client";

import {
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./scrollable-container.module.css";
import { observeScrollableContent } from "./scrollable-container-content-observer";

interface ScrollableContainerStickyProps {
  containerRef: RefObject<HTMLDivElement | null>;
  useWindowScroll: boolean;
  stickToBottom: boolean;
  bottomThreshold: number;
  showScrollToBottom: boolean;
  forceScrollOnContentChange: boolean;
  isDesktopViewport: boolean;
}

function ScrollableContainerSticky({
  containerRef,
  useWindowScroll,
  stickToBottom,
  bottomThreshold,
  showScrollToBottom,
  forceScrollOnContentChange,
  isDesktopViewport,
}: ScrollableContainerStickyProps) {
  const [showBottomIndicator, setShowBottomIndicator] = useState(false);
  const isAtBottomRef = useRef(stickToBottom);

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

  const checkIsAtBottom = useCallback(
    (container: HTMLElement) => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      return scrollHeight - scrollTop - clientHeight <= bottomThreshold;
    },
    [bottomThreshold],
  );

  const scrollToBottom = useCallback(
    (smooth = true) => {
      const scrollElement = getScrollElement();
      if (!scrollElement) {
        return;
      }
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight - scrollElement.clientHeight,
        behavior: smooth ? "smooth" : "auto",
      });
      setShowBottomIndicator(false);
      isAtBottomRef.current = true;
    },
    [getScrollElement],
  );

  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom(true);
  }, [scrollToBottom]);

  const updateScrollTracking = useCallback(
    (container: HTMLElement) => {
      if (!stickToBottom) {
        return;
      }
      const atBottom = checkIsAtBottom(container);
      isAtBottomRef.current = atBottom;

      if (atBottom && showScrollToBottom) {
        setShowBottomIndicator(false);
      }
    },
    [checkIsAtBottom, showScrollToBottom, stickToBottom],
  );

  const handleNativeScroll = useCallback(() => {
    const container = getScrollElement();
    if (!container) {
      return;
    }
    updateScrollTracking(container);
  }, [getScrollElement, updateScrollTracking]);

  useEffect(() => {
    if (!stickToBottom) {
      setShowBottomIndicator(false);
    }
  }, [stickToBottom]);

  useEffect(() => {
    const container = getScrollElement();
    if (!container) {
      return;
    }

    if (stickToBottom) {
      scrollToBottom(false);
      isAtBottomRef.current = true;
    } else {
      updateScrollTracking(container);
    }

    const scrollHandler = handleNativeScroll;

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

    const stopObservingContent = observeScrollableContent({
      root: containerRef.current,
      onChange: () => {
        if (
          stickToBottom &&
          (forceScrollOnContentChange || isAtBottomRef.current)
        ) {
          requestAnimationFrame(() => {
            scrollToBottom(true);
          });
        } else if (
          stickToBottom &&
          showScrollToBottom &&
          !isAtBottomRef.current
        ) {
          setShowBottomIndicator(true);
        }
      },
    });

    return () => {
      if (useWindowScroll) {
        window.removeEventListener("scroll", scrollHandler as EventListener);
        window.removeEventListener("resize", scrollHandler as EventListener);
      } else {
        container.removeEventListener("scroll", scrollHandler as EventListener);
      }
      stopObservingContent();
    };
  }, [
    containerRef,
    forceScrollOnContentChange,
    getScrollElement,
    handleNativeScroll,
    scrollToBottom,
    showScrollToBottom,
    stickToBottom,
    updateScrollTracking,
    useWindowScroll,
  ]);

  return (
    <>
      {isDesktopViewport &&
        stickToBottom &&
        showScrollToBottom &&
        showBottomIndicator && (
          <button
            type="button"
            className={styles.scrollToBottomButton}
            onClick={handleScrollToBottomClick}
            aria-label="Scroll to bottom"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
    </>
  );
}

export default memo(ScrollableContainerSticky);
