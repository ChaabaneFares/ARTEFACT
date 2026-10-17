import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FadeInImage from "@/components/ui/fadeInImage";
import { intlLocale } from "@/i18n/format";
import { localizedAlternates, shareMetadata } from "@/i18n/metadata";
import { resolveLocale } from "@/i18n/server";
import styles from "../_components/project-detail/project-detail.module.css";
import { getProjects, projects } from "../_data/projects";
import { projectDetailCopy } from "./project-detail.copy";

type Props = { params: Promise<{ locale: string; slug: string }> };

// Keep known views static, and let the page's notFound guard handle unknown
// slugs without Next's disabled-fallback path logging an internal error.
export const dynamicParams = true;
export function generateStaticParams() {
  return projects.flatMap((project) =>
    project.slug ? [{ slug: project.slug }] : [],
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const project = getProjects(locale).find((item) => item.slug === slug);
  const title = project
    ? `${project.name} | Artefact Studio`
    : projectDetailCopy[locale].notFound;
  const path = `/projects/${slug}`;
  return {
    title,
    description: project?.description,
    alternates: localizedAlternates(path, locale),
    ...shareMetadata({
      locale,
      path,
      title,
      description: project?.description,
    }),
  };
}

export default async function ProjectPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const copy = projectDetailCopy[locale];
  const projects = getProjects(locale);
  const number = new Intl.NumberFormat(intlLocale(locale));
  const first = new Intl.NumberFormat(intlLocale(locale), {
    minimumIntegerDigits: 2,
  });
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const sequence = [
    project,
    ...projects.filter(
      (item) => item.family === project.family && item.slug !== slug,
    ),
  ];
  return (
    <main
      className={styles.detail}
      data-project-detail
      aria-label={project.name}
    >
      <h1 className={styles.accessibleTitle}>{project.name}</h1>
      {sequence.map((item, index) => (
        <div className={styles.frame} key={item.id}>
          <FadeInImage
            unoptimized
            className={styles.image}
            src={item.image ?? ""}
            alt={copy.view
              .replace("{name}", project.name)
              .replace("{number}", number.format(index + 1))}
            width={item.width}
            height={item.height}
            sizes="(max-width: 450px) 100vw, 80vh"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      <div className={styles.counter}>
        {first.format(1)}/ 0{number.format(sequence.length)}
      </div>
    </main>
  );
}
