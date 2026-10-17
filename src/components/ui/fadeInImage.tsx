"use client";

import Image, { type ImageProps } from "next/image";
import { brandedImageSource } from "@/config/media-branding";
import { useFadeInImage } from "./fadeInImage.logic";
import styles from "./fadeInImage.module.css";

/**
 * next/image that fades in once its pixels are decodable, so lazily loaded
 * images never pop. Pairs onLoad with a synchronous `complete` probe in a
 * callback ref, because SSR'd or cached images fire `load` before hydration
 * attaches listeners and would otherwise stay hidden forever.
 */
export default function FadeInImage({
  className,
  onLoad,
  ...props
}: ImageProps) {
  const src =
    typeof props.src === "string" ? brandedImageSource(props.src) : props.src;
  const { isLoaded, handleLoad, handleRef } = useFadeInImage(src, onLoad);

  return (
    <Image
      {...props}
      src={src}
      className={[styles.image, className].filter(Boolean).join(" ")}
      ref={handleRef}
      data-loaded={isLoaded ? "true" : "false"}
      onLoad={handleLoad}
    />
  );
}
