"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  whenLandingMediaIdle,
  whenLandingMediaNearIdle,
} from "@/lib/landing3d/mediaScheduler";
import { waitForScrollQuiet } from "@/lib/landing3d/sceneBootGate";

export const TOUR_SRC = "/vr/03-Home/Output/index.html";
const TOUR_PARK_MARGIN = "35% 0px";
// The initial panorama's tile payload is ~33MB, so the iframe mounts after the
// viewport-priority queue drains — or earlier, the moment the user
// approaches the section.
const TOUR_APPROACH_MARGIN = "150% 0px";

type PanoWindow = Window & {
  tourNavigation?: {
    setInteractionEnabled: (enabled: boolean) => void;
    setPreloadEnabled: (enabled: boolean) => void;
  };
  pano?: {
    getFov?: () => number;
    getIsLoaded?: () => boolean;
    getIsTileLoading?: () => boolean;
    getPan?: () => number;
    getTilt?: () => number;
    requestRedraw?: () => void;
    setLocked?: (locked: boolean) => void;
    setPanTiltFov?: (pan: number, tilt: number, fov: number) => void;
    setViewerSize?: (width: number, height: number) => void;
    update?: () => void;
  };
};

type TourView = {
  fov: number;
  pan: number;
  tilt: number;
};

type BufferedVisibilityOptions = {
  defaultValue: boolean;
  enabled: boolean;
  rootMargin: string;
  targetRef: RefObject<Element | null>;
};

function useBufferedVisibility({
  defaultValue,
  enabled,
  rootMargin,
  targetRef,
}: BufferedVisibilityOptions) {
  const [isVisible, setIsVisible] = useState(defaultValue);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(defaultValue);
      return;
    }

    const target = targetRef.current;

    if (!target || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const nextIsVisible = entry?.isIntersecting ?? defaultValue;

        setIsVisible((currentValue) =>
          currentValue === nextIsVisible ? currentValue : nextIsVisible,
        );
      },
      { rootMargin },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [defaultValue, enabled, rootMargin, targetRef]);

  return isVisible;
}

export function useVirtualTourLogic() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tourRef = useRef<HTMLDivElement>(null);
  const parkedViewRef = useRef<TourView | null>(null);
  const [isFrontLayerVisible, setIsFrontLayerVisible] = useState(true);
  const [isTourReady, setIsTourReady] = useState(false);
  const [shouldMountTour, setShouldMountTour] = useState(false);
  const [isTourFullscreen, setIsTourFullscreen] = useState(false);
  const isTourInViewport = useBufferedVisibility({
    targetRef: tourRef,
    enabled: true,
    rootMargin: "0px",
    defaultValue: false,
  });
  const isTourPaintVisible = useBufferedVisibility({
    targetRef: tourRef,
    enabled: isTourReady,
    rootMargin: TOUR_PARK_MARGIN,
    defaultValue: true,
  });
  const isTourVisible = isTourInViewport || isTourFullscreen;
  const isTourParked = isTourReady && !isTourPaintVisible && !isTourFullscreen;

  useEffect(() => {
    if (!isTourReady) return;

    const tourDocument = iframeRef.current?.contentDocument;
    let frameId = 0;
    const syncFullscreen = () => {
      const iframe = iframeRef.current;
      setIsTourFullscreen(
        Boolean(iframe && document.fullscreenElement === iframe),
      );
    };
    const queueSync = () => {
      // Read after fullscreen settles across the iframe and parent documents.
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncFullscreen);
    };

    // Pano2VR uses webkitRequestFullScreen when the browser exposes it.
    const events = ["fullscreenchange", "webkitfullscreenchange"];
    for (const event of events) {
      document.addEventListener(event, queueSync, true);
      tourDocument?.addEventListener(event, queueSync, true);
    }
    syncFullscreen();

    return () => {
      for (const event of events) {
        document.removeEventListener(event, queueSync, true);
        tourDocument?.removeEventListener(event, queueSync, true);
      }
      window.cancelAnimationFrame(frameId);
    };
  }, [isTourReady]);

  const getPanoWindow = useCallback(() => {
    return iframeRef.current?.contentWindow as PanoWindow | null;
  }, []);

  const readTourView = useCallback((): TourView | null => {
    const pano = getPanoWindow()?.pano;
    const pan = pano?.getPan?.();
    const tilt = pano?.getTilt?.();
    const fov = pano?.getFov?.();

    if (
      typeof pan !== "number" ||
      typeof tilt !== "number" ||
      typeof fov !== "number" ||
      !Number.isFinite(pan) ||
      !Number.isFinite(tilt) ||
      !Number.isFinite(fov)
    ) {
      return null;
    }

    return { fov, pan, tilt };
  }, [getPanoWindow]);

  const updateTourReadyState = useCallback(() => {
    try {
      const panoWindow = getPanoWindow();
      const pano = panoWindow?.pano;
      const isLoaded = Boolean(pano?.getIsLoaded?.());
      const isLoadingTiles = Boolean(pano?.getIsTileLoading?.());
      const isReady = isLoaded && !isLoadingTiles;

      setIsTourReady(isReady);
      return isReady;
    } catch {
      setIsTourReady(false);
      return false;
    }
  }, [getPanoWindow]);

  const refreshTourViewport = useCallback(() => {
    try {
      const panoWindow = getPanoWindow();
      const pano = panoWindow?.pano;
      const container = panoWindow?.document.getElementById("container");

      if (container) {
        pano?.setViewerSize?.(container.offsetWidth, container.offsetHeight);
      }

      pano?.setLocked?.(false);
      pano?.update?.();
      pano?.requestRedraw?.();
    } catch {
      // Ignore iframe access races while the tour is mounting or remounting.
    }
  }, [getPanoWindow]);

  useEffect(() => {
    if (!isTourReady) {
      return;
    }

    try {
      const pano = getPanoWindow()?.pano;

      if (isTourParked) {
        parkedViewRef.current = parkedViewRef.current ?? readTourView();
        pano?.setLocked?.(true);
        return;
      }

      pano?.setLocked?.(false);

      const parkedView = parkedViewRef.current;

      if (parkedView) {
        pano?.setPanTiltFov?.(parkedView.pan, parkedView.tilt, parkedView.fov);
        parkedViewRef.current = null;
      }
    } catch {
      return;
    }

    const frameId = window.requestAnimationFrame(refreshTourViewport);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    getPanoWindow,
    isTourParked,
    isTourReady,
    readTourView,
    refreshTourViewport,
  ]);

  useEffect(() => {
    let isCancelled = false;

    // The tour streams ~5MB of tiles and its pano engine boots on this same
    // main thread (same-origin iframe), so it must never compete with media
    // the user is looking at, nor boot mid-scroll.
    const mountTour = () => {
      void waitForScrollQuiet().then(() => {
        if (!isCancelled) {
          setShouldMountTour(true);
        }
      });
    };

    void whenLandingMediaIdle().then(mountTour);

    const target = tourRef.current;

    if (!target || !("IntersectionObserver" in window)) {
      return () => {
        isCancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // Approaching only shortcuts the wait for FULL idle; the user's own
          // screen still gets the bandwidth first.
          void whenLandingMediaNearIdle().then(mountTour);
          observer.disconnect();
        }
      },
      { rootMargin: TOUR_APPROACH_MARGIN },
    );

    observer.observe(target);

    return () => {
      isCancelled = true;
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!shouldMountTour || isTourReady) {
      return;
    }

    if (updateTourReadyState()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (updateTourReadyState()) {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldMountTour, isTourReady, updateTourReadyState]);

  useEffect(() => {
    if (!isTourReady) return;

    const navigation = getPanoWindow()?.tourNavigation;
    navigation?.setInteractionEnabled(!isFrontLayerVisible);

    return () => navigation?.setInteractionEnabled(false);
  }, [getPanoWindow, isFrontLayerVisible, isTourReady]);

  useEffect(() => {
    if (!isTourReady || !isTourVisible || isFrontLayerVisible) {
      return;
    }

    let isCancelled = false;
    const updatePreloading = async () => {
      getPanoWindow()?.tourNavigation?.setPreloadEnabled(false);
      if (document.hidden) return;

      // Warm other locations only after the user enters the tour, once the
      // current view and the landing media queue have completely drained.
      await whenLandingMediaIdle();
      await waitForScrollQuiet();
      if (!isCancelled && !document.hidden) {
        getPanoWindow()?.tourNavigation?.setPreloadEnabled(true);
      }
    };

    void updatePreloading();
    document.addEventListener("visibilitychange", updatePreloading);

    return () => {
      isCancelled = true;
      document.removeEventListener("visibilitychange", updatePreloading);
      getPanoWindow()?.tourNavigation?.setPreloadEnabled(false);
    };
  }, [getPanoWindow, isFrontLayerVisible, isTourReady, isTourVisible]);

  const startInteracting = () => {
    if (!isTourReady && !updateTourReadyState()) {
      return;
    }

    setIsFrontLayerVisible(false);
  };

  const stopInteracting = () => {
    setIsFrontLayerVisible(true);
  };

  return {
    iframeRef,
    tourRef,
    isFrontLayerVisible,
    isTourReady,
    shouldMountTour,
    isTourVisible,
    isTourParked,
    updateTourReadyState,
    startInteracting,
    stopInteracting,
  };
}
