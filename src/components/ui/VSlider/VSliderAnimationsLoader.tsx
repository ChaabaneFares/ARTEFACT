"use client";

import { useVSliderAnimationsLoader } from "./VSliderAnimationsLoader.logic";

type VSliderAnimationsLoaderProps = {
  sliderId: string;
  variant?: "projects" | "services";
};

export default function VSliderAnimationsLoader({
  sliderId,
  variant = "projects",
}: VSliderAnimationsLoaderProps) {
  const { AnimateComponent } = useVSliderAnimationsLoader(variant);

  if (!AnimateComponent) {
    return null;
  }

  return <AnimateComponent sliderId={sliderId} />;
}
