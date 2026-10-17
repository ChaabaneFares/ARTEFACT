"use client";

import type { ReactNode } from "react";
import styles from "./virtual-tour.module.css";
import { TOUR_SRC, useVirtualTourLogic } from "./virtual-tour-client.logic";

export type VirtualTourLabels = {
  title: string;
  loading: string;
  start: string;
  stop: string;
};

export default function VirtualTourClient({
  children,
  labels,
}: {
  children: ReactNode;
  labels: VirtualTourLabels;
}) {
  const {
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
  } = useVirtualTourLogic();

  return (
    <div
      ref={tourRef}
      className={`${styles.vrHome} vr-home`}
      data-vr-tour
      data-mounted="true"
      data-tour-parked={isTourParked}
      data-tour-ready={isTourReady}
      aria-busy={!isTourReady}
    >
      {shouldMountTour ? (
        <iframe
          ref={iframeRef}
          src={TOUR_SRC}
          className={`${styles.vrItem} vr-item`}
          title={labels.title}
          allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
          loading="eager"
          aria-hidden={isTourParked || !isTourReady}
          tabIndex={isTourReady ? 0 : -1}
          onLoad={updateTourReadyState}
        />
      ) : null}

      <output
        className={styles.loadingScreen}
        data-ready={isTourReady}
        data-active={isTourVisible}
        aria-label={labels.loading}
        aria-hidden={isTourReady}
      >
        <span className={styles.loader} aria-hidden="true" />
      </output>

      <button
        type="button"
        className={`${styles.frontlayer} frontlayer`}
        data-ready={isTourReady}
        data-visible={isFrontLayerVisible}
        disabled={!isTourReady}
        onClick={startInteracting}
        aria-label={labels.start}
      >
        {children}
      </button>

      <button
        type="button"
        className={`${styles.exitVr} exit-vr`}
        data-ready={isTourReady}
        disabled={!isTourReady}
        onClick={stopInteracting}
        aria-label={labels.stop}
      />
    </div>
  );
}
