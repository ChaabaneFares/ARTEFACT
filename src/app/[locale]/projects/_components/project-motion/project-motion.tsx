"use client";

import type { ProjectCategory } from "../project-catalog/project-catalog.types";
import { useProjectMotionLoader } from "./project-motion.logic";

export default function ProjectMotion({
  category,
}: {
  category: ProjectCategory;
}) {
  const { Controller } = useProjectMotionLoader();
  return Controller ? <Controller category={category} /> : null;
}
