import type { Locale } from "@/i18n/routing";
import type { Project } from "../../_data/projects";
import ProjectTour from "../project-tour/project-tour";
import ProjectVideo from "../project-video/project-video";
import ProjectCardFrame from "./components/project-card-frame/project-card-frame";
import ProjectCardImage from "./components/project-card-image/project-card-image";
import ProjectLink from "./components/project-link/project-link";
import { projectCardCopy } from "./project-card.copy";
import styles from "./project-card.module.css";
import type { CategoryIndexes } from "./project-card.types";

export default function ProjectCard({
  project,
  locale,
  categoryIndexes,
}: {
  project: Project;
  locale: Locale;
  categoryIndexes: CategoryIndexes;
}) {
  const copy = projectCardCopy[locale];
  return (
    <ProjectCardFrame
      categoryIndexes={categoryIndexes}
      kind={project.tourUrl ? "tour" : project.videoId ? "video" : "image"}
    >
      {project.videoId ? (
        <ProjectVideo project={project} locale={locale} />
      ) : project.tourUrl ? (
        <ProjectTour
          className={styles.tourFrame}
          src={project.tourUrl}
          title={copy.tour
            .replace("{name}", project.name)
            .replace("{id}", project.id)}
        />
      ) : (
        <ProjectLink
          locale={locale}
          ariaLabel={copy.view.replace("{name}", project.name)}
          slug={project.slug ?? ""}
          name={project.name}
          cursorColor={project.cursorColor}
          image
        >
          <ProjectCardImage
            categoryIndexes={categoryIndexes}
            src={project.image ?? ""}
            alt={project.name}
          />
        </ProjectLink>
      )}
      <div className={styles.caption}>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        {project.slug && (
          <ProjectLink locale={locale} slug={project.slug} name={project.name}>
            {copy.viewProject}
          </ProjectLink>
        )}
      </div>
    </ProjectCardFrame>
  );
}
