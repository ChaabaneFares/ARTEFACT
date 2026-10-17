"use client";

import {
  type CSSProperties,
  lazy,
  memo,
  type ReactNode,
  type RefObject,
  Suspense,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { dimensionsStore } from "@/store/dimensionsStore";
import styles from "./scrollable-container.module.css";

export type ScrollableContainerThumbIdleMode = "hidden" | "thin-visible";

interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxHeight?: string;
  height?: string;
  containerRef?: RefObject<HTMLDivElement | null>;
  forceCustomScrollbar?: boolean;
  thumbIdleMode?: ScrollableContainerThumbIdleMode;
  useWindowScroll?: boolean;
  stickToBottom?: boolean;
  bottomThreshold?: number;
  showScrollToBottom?: boolean;
  forceScrollOnContentChange?: boolean;
}

const ScrollableContainerScrollbar = lazy(
  () => import("./scrollable-container-scrollbar"),
);
const ScrollableContainerSticky = lazy(
  () => import("./scrollable-container-sticky"),
);

function ScrollableContainer({
  children,
  className = "",
  style = {},
  maxHeight,
  height,
  containerRef: externalContainerRef,
  forceCustomScrollbar = false,
  thumbIdleMode = "hidden",
  useWindowScroll = false,
  stickToBottom = false,
  bottomThreshold = 50,
  showScrollToBottom = false,
  forceScrollOnContentChange = false,
}: ScrollableContainerProps) {
  const localContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = externalContainerRef ?? localContainerRef;
  const { isDesktop } = dimensionsStore();
  const usesCustomScrollbar = forceCustomScrollbar || isDesktop();

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

  useEffect(() => {
    if (!stickToBottom) {
      return;
    }
    const scrollElement = getScrollElement();
    if (!scrollElement) {
      return;
    }
    scrollElement.scrollTo({
      top: scrollElement.scrollHeight - scrollElement.clientHeight,
      behavior: "auto",
    });
  }, [getScrollElement, stickToBottom]);

  const containerClassName = useWindowScroll
    ? className
    : `${styles.container} ${className}`;
  const containerStyle: CSSProperties | undefined = useWindowScroll
    ? style
    : {
        maxHeight,
        height,
        WebkitOverflowScrolling: "touch",
        ...style,
      };
  const shouldLoadSticky =
    stickToBottom || showScrollToBottom || forceScrollOnContentChange;

  return (
    <div
      className={`${styles.wrapper} ${
        useWindowScroll ? styles.windowScroll : ""
      } ${className}`}
    >
      <div
        ref={containerRef}
        className={containerClassName}
        style={containerStyle}
      >
        {children}
      </div>

      {usesCustomScrollbar && (
        <Suspense fallback={null}>
          <ScrollableContainerScrollbar
            containerRef={containerRef}
            useWindowScroll={useWindowScroll}
            isDesktopViewport={usesCustomScrollbar}
            thumbIdleMode={thumbIdleMode}
          />
        </Suspense>
      )}

      {shouldLoadSticky && (
        <Suspense fallback={null}>
          <ScrollableContainerSticky
            containerRef={containerRef}
            useWindowScroll={useWindowScroll}
            stickToBottom={stickToBottom}
            bottomThreshold={bottomThreshold}
            showScrollToBottom={showScrollToBottom}
            forceScrollOnContentChange={forceScrollOnContentChange}
            isDesktopViewport={usesCustomScrollbar}
          />
        </Suspense>
      )}
    </div>
  );
}

export default memo(ScrollableContainer);
