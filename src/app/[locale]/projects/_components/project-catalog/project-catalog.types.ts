export type ProjectCategory =
  | "Projects"
  | "Interior"
  | "Exterior"
  | "Animation"
  | "3D Rendering"
  | "Concept"
  | "Virtual tour"
  | "3D Model";

export type ProjectCategoryOption = {
  id: ProjectCategory;
  hash: string;
  label: string;
  mobileLabel: string;
};

export type ProjectCategories = {
  desktop: readonly ProjectCategoryOption[];
  mobile: readonly ProjectCategoryOption[];
};
