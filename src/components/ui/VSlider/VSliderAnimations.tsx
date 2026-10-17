"use client";

import { useVSliderAnimations } from "./VSliderAnimations.logic";

export default function VSliderAnimations({ sliderId }: { sliderId: string }) {
  useVSliderAnimations(sliderId);
  return null;
}
