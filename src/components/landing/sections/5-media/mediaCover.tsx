"use client";

import { useImageReveal } from "@/lib/useImageReveal";

type MediaCoverProps = {
  className: string;
  imageUrl: string;
};

export default function MediaCover({ className, imageUrl }: MediaCoverProps) {
  const isLoaded = useImageReveal(imageUrl);

  return (
    <div
      className={className}
      data-img-loaded={isLoaded ? "true" : "false"}
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
}
