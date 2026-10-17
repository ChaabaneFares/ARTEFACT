"use client";

import { useProjectTour } from "./project-tour.logic";
import styles from "./project-tour.module.css";

type Props = { src: string; title: string; className: string };
export default function ProjectTour({ src, title, className }: Props) {
  const { ref, inView } = useProjectTour();
  return (
    <div ref={ref} className={className}>
      {inView && (
        <iframe
          className={styles.frame}
          src={src}
          title={title}
          loading="lazy"
          allow="xr-spatial-tracking; fullscreen"
          allowFullScreen
        />
      )}
    </div>
  );
}
