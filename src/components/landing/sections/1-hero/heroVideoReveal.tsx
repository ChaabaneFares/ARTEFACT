"use client";

import { useEffect } from "react";

const HERO_VIDEO_SELECTOR = "[data-hero-video]";

export default function HeroVideoReveal() {
  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>(HERO_VIDEO_SELECTOR);

    if (!video) {
      return;
    }

    const reveal = () => {
      video.dataset.videoReady = "true";
    };

    // The SSR'd autoplay video can reach a decodable frame before hydration
    // attaches these listeners.
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      reveal();
      return;
    }

    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("playing", reveal, { once: true });

    return () => {
      video.removeEventListener("loadeddata", reveal);
      video.removeEventListener("playing", reveal);
    };
  }, []);

  return null;
}
