"use client";

import { useAboutAnimationLoader } from "./about-animation-loader.logic";

export default function AboutAnimationLoader() {
  const { Animation } = useAboutAnimationLoader();
  return Animation ? <Animation /> : null;
}
