"use client";

import type { ProjectCategory } from "../project-catalog/project-catalog.types";
import { useProjectMotionAnimation } from "./project-motion.animate.logic";

export default function ProjectMotionAnimation({
  category,
}: {
  category: ProjectCategory;
}) {
  useProjectMotionAnimation(category);
  return null;
}
