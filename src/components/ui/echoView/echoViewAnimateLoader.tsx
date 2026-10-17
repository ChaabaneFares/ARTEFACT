"use client";

import { startTransition, useEffect, useState } from "react";
import {
  getEchoViewRootSelector,
  type ResolvedEchoViewData,
} from "./echoView.shared";

type EchoViewAnimateComponent = typeof import("./echoView.animate").default;

type EchoViewAnimateLoaderProps = {
  data: ResolvedEchoViewData;
  disabledBelowDesktop?: boolean;
};

const ECHO_VIEW_PRELOAD_MARGIN = "20% 0px";
const ECHO_VIEW_IDLE_PRELOAD_DELAY_MS = 750;
const ECHO_VIEW_BELOW_DESKTOP_MEDIA_QUERY = "(max-width: 1024px)";

export default function EchoViewAnimateLoader({
  data,
  disabledBelowDesktop = false,
}: EchoViewAnimateLoaderProps) {
  const [shouldActivate, setShouldActivate] = useState(false);
  const [isDisabledForViewport, setIsDisabledForViewport] = useState(false);
  const [AnimateComponent, setAnimateComponent] =
    useState<EchoViewAnimateComponent | null>(null);

  useEffect(() => {
    if (!disabledBelowDesktop) {
      setIsDisabledForViewport(false);
      return;
    }

    const mediaQuery = window.matchMedia(ECHO_VIEW_BELOW_DESKTOP_MEDIA_QUERY);
    const syncDisabledState = () => {
      setIsDisabledForViewport(mediaQuery.matches);

      if (mediaQuery.matches) {
        setShouldActivate(false);
      }
    };

    syncDisabledState();
    mediaQuery.addEventListener("change", syncDisabledState);

    return () => {
      mediaQuery.removeEventListener("change", syncDisabledState);
    };
  }, [disabledBelowDesktop]);

  useEffect(() => {
    if (isDisabledForViewport) {
      return;
    }

    const root = document.querySelector<HTMLElement>(
      getEchoViewRootSelector(data.id),
    );

    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const nextShouldActivate = entry?.isIntersecting ?? false;

        setShouldActivate((currentValue) =>
          currentValue === nextShouldActivate
            ? currentValue
            : nextShouldActivate,
        );
      },
      { rootMargin: ECHO_VIEW_PRELOAD_MARGIN },
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
    };
  }, [data.id, isDisabledForViewport]);

  useEffect(() => {
    if (AnimateComponent || isDisabledForViewport) {
      return;
    }

    const preload = () => {
      void import("./echoView.animate");
    };

    const idleCallbackId =
      "requestIdleCallback" in window
        ? window.requestIdleCallback(preload, {
            timeout: ECHO_VIEW_IDLE_PRELOAD_DELAY_MS,
          })
        : null;
    const timeoutId =
      idleCallbackId === null
        ? window.setTimeout(preload, ECHO_VIEW_IDLE_PRELOAD_DELAY_MS)
        : null;

    return () => {
      if (idleCallbackId !== null) {
        window.cancelIdleCallback(idleCallbackId);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [AnimateComponent, isDisabledForViewport]);

  useEffect(() => {
    if (!shouldActivate || AnimateComponent || isDisabledForViewport) {
      return;
    }

    let isCancelled = false;

    void import("./echoView.animate").then((module) => {
      if (isCancelled) {
        return;
      }

      startTransition(() => {
        setAnimateComponent(() => module.default);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [AnimateComponent, isDisabledForViewport, shouldActivate]);

  if (!AnimateComponent || !shouldActivate || isDisabledForViewport) {
    return null;
  }

  return <AnimateComponent data={data} />;
}
