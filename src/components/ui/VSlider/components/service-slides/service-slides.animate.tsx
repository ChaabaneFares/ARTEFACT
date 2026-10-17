"use client";

import { useServiceSlidesAnimation } from "./service-slides.logic";

export default function ServiceSlidesAnimation({
  sliderId,
}: {
  sliderId: string;
}) {
  useServiceSlidesAnimation(sliderId);
  return null;
}
