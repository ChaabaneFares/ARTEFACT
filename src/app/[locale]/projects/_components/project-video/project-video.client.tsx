"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { useProjectVideo } from "./project-video.client.logic";
import styles from "./project-video.module.css";

export default function ProjectVideoClient({
  src,
  animationLabel,
  playLabel,
  captionsLabel,
  locale,
  captions,
  children,
}: {
  src: string;
  animationLabel: string;
  playLabel: string;
  captionsLabel: string;
  locale: Locale;
  captions: string;
  children: ReactNode;
}) {
  const { playing, play } = useProjectVideo();
  return (
    <div className={styles.player}>
      {playing ? (
        <video
          src={src}
          aria-label={animationLabel}
          controls
          autoPlay
          playsInline
          preload="metadata"
        >
          <track
            kind="captions"
            src={captions}
            srcLang={locale}
            label={captionsLabel}
          />
        </video>
      ) : (
        <button
          className={styles.poster}
          type="button"
          onClick={play}
          aria-label={playLabel}
        >
          {children}
        </button>
      )}
    </div>
  );
}
