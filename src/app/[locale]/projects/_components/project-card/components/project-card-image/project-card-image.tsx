"use client";

import FadeInImage from "@/components/ui/fadeInImage";
import styles from "../../project-card.module.css";
import type { CategoryIndexes } from "../../project-card.types";
import { useProjectCardImage } from "./project-card-image.logic";

export default function ProjectCardImage({
  categoryIndexes,
  src,
  alt,
}: {
  categoryIndexes: CategoryIndexes;
  src: string;
  alt: string;
}) {
  const { loading } = useProjectCardImage(categoryIndexes);
  return (
    <FadeInImage
      unoptimized
      className={styles.image}
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 450px) 100vw, (max-width: 768px) 90vw, 34vw"
      loading={loading}
    />
  );
}
