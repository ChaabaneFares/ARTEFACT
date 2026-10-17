import type { Locale } from "@/i18n/routing";
import { getProjectCategories } from "../../_data/project-categories";
import { getProjects } from "../../_data/projects";
import ProjectCard from "../project-card/project-card";
import ProjectFilters from "./components/project-filters/project-filters";
import ProjectGallery from "./components/project-gallery/project-gallery";
import ProjectCatalogClient from "./project-catalog.client";
import { projectCatalogCopy } from "./project-catalog.copy";
import styles from "./project-catalog.module.css";

export default function ProjectCatalog({ locale }: { locale: Locale }) {
  const copy = projectCatalogCopy[locale];
  const categories = getProjectCategories(locale);
  const desktopCategories = categories.desktop.map(({ id }) => id);
  const projects = getProjects(locale);
  const positions = new Map(
    desktopCategories.map((category) => [
      category,
      new Map(
        projects
          .filter((project) => project.categoryIds.includes(category))
          .map((project, index) => [project.id, index]),
      ),
    ]),
  );
  return (
    <ProjectCatalogClient locale={locale} categories={categories}>
      <section className={styles.hero} data-project-hero>
        <div className={styles.heroContent}>
          <h1 data-page-transition-item>{copy.title}</h1>
          <ProjectFilters categories={categories} />
        </div>
      </section>
      <ProjectGallery>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            locale={locale}
            categoryIndexes={Object.fromEntries(
              desktopCategories.map((category) => [
                category,
                positions.get(category)?.get(project.id) ?? -1,
              ]),
            )}
          />
        ))}
      </ProjectGallery>
    </ProjectCatalogClient>
  );
}
