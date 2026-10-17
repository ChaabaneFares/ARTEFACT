export type VSliderItem = {
  title: string;
  href: string;
  image: string;
  accentColor?: string;
  alt?: string;
  background?: string;
  buttonLabel?: string;
  eyebrow?: string;
  /** Screen-reader text for a service image link, in the page's language. */
  linkLabel?: string;
  tags?: readonly string[] | string;
  description?: string;
  id?: string;
};

export type VSliderProps = {
  items: readonly VSliderItem[];
  buttonLabel?: string;
  className?: string;
  compactResponsiveIntro?: boolean;
  variant?: "projects" | "services";
};
