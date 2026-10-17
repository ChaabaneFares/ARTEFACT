import FadeInImage from "@/components/ui/fadeInImage";
import { PORTFOLIO_VIDEO_SOURCES } from "@/config/media";
import type { Locale } from "@/i18n/routing";
import type { Project } from "../../_data/projects";
import ProjectVideoClient from "./project-video.client";
import { projectVideoCopy } from "./project-video.copy";
import styles from "./project-video.module.css";

export default function ProjectVideo({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const copy = projectVideoCopy[locale];
  return (
    <>
      <ProjectVideoClient
        src={PORTFOLIO_VIDEO_SOURCES[project.videoId ?? ""]}
        animationLabel={copy.animation.replace("{name}", project.name)}
        playLabel={copy.play.replace("{name}", project.name)}
        captionsLabel={copy.captions}
        locale={locale}
        captions={
          ["34hD4u8WFuI", "xgWT3ZnPa40"].includes(project.videoId ?? "")
            ? locale === "en"
              ? "/assets/video/portfolio/music.vtt"
              : `data:text/vtt;charset=utf-8,${encodeURIComponent(`WEBVTT\n\n00:00.000 --> 01:02.200\n${copy.music}\n`)}`
            : "/assets/video/portfolio/silent.vtt"
        }
      >
        <FadeInImage
          unoptimized
          src={project.image ?? ""}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 34vw"
        />
        <span className={styles.play} aria-hidden="true">
          <svg viewBox="0 0 288.01 335.95" aria-hidden="true">
            <path d="M0,168.33Q0,104.76,0,41.19c0-19.57,12.36-35.35,31-40C42-1.56,52,.64,61.6,6.22q53.46,31,107,61.89,48.65,28.11,97.28,56.25c11.68,6.78,19.17,16.82,21.37,30.16,3.18,19.19-3.61,34.58-19.89,45.08C238.82,218,210,236,181.27,254.14q-59.39,37.53-118.78,75.05c-23.34,14.7-52.7,4.46-60.55-21.2A47.88,47.88,0,0,1,.1,294.34C0,252.33,0,210.33,0,168.33Z" />
          </svg>
        </span>
      </ProjectVideoClient>
      <div className={styles.caption}>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
      </div>
    </>
  );
}
