import { type RefObject, useEffect, useRef, useState } from "react";
import { subscribeToScenePreboot } from "./sceneBootGate";

type UseSceneActivationOptions = {
  activateMargin: string;
  enabled?: boolean;
  prewarmMargin?: string;
  preload?: () => void;
  targetRef: RefObject<Element | null>;
};

type SceneActivationState = {
  isActive: boolean;
  shouldMount: boolean;
};

export function useSceneActivation({
  activateMargin,
  enabled = true,
  prewarmMargin,
  preload,
  targetRef,
}: UseSceneActivationOptions) {
  const [isActive, setIsActive] = useState(false);
  const [shouldMount, setShouldMount] = useState(false);
  const preloadRef = useRef(preload);

  preloadRef.current = preload;

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      setShouldMount(false);
      return;
    }

    const target = targetRef.current;

    if (!target) {
      return;
    }

    let didPrewarm = false;

    const runPreload = () => {
      if (didPrewarm) {
        return;
      }

      didPrewarm = true;
      preloadRef.current?.();
    };

    const activateObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const nextIsActive = entry?.isIntersecting ?? false;

        setIsActive((currentValue) =>
          currentValue === nextIsActive ? currentValue : nextIsActive,
        );

        if (nextIsActive) {
          setShouldMount(true);
        }
      },
      { rootMargin: activateMargin },
    );

    activateObserver.observe(target);

    let prewarmObserver: IntersectionObserver | null = null;

    if (prewarmMargin && preloadRef.current) {
      const nextPrewarmObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          if (!entry?.isIntersecting) {
            return;
          }

          runPreload();
          setShouldMount(true);
          nextPrewarmObserver.disconnect();
        },
        { rootMargin: prewarmMargin },
      );

      prewarmObserver = nextPrewarmObserver;
    }

    prewarmObserver?.observe(target);

    // Idle pre-boot: once the landing shell signals the page is quiet, mount
    // and warm this scene even if its viewport observers never fired.
    const unsubscribePreboot = subscribeToScenePreboot(() => {
      runPreload();
      setShouldMount(true);
    });

    return () => {
      activateObserver.disconnect();
      prewarmObserver?.disconnect();
      unsubscribePreboot();
    };
  }, [activateMargin, enabled, prewarmMargin, targetRef]);

  return { isActive, shouldMount } satisfies SceneActivationState;
}
