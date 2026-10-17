"use client";

import Link from "next/link";
import styles from "./VSlider.module.css";
import { useVSliderCta } from "./VSliderCta.logic";
import interactionStyles from "./VSliderCta.module.css";

type VSliderCtaProps = {
  borderColor?: string;
  href: string;
  label: string;
  className?: string;
};

export default function VSliderCta({
  borderColor,
  href,
  label,
  className,
}: VSliderCtaProps) {
  const { buttonRef } = useVSliderCta();
  return (
    <Link
      ref={buttonRef}
      className={[styles.projectCta, interactionStyles.button, className]
        .filter(Boolean)
        .join(" ")}
      href={href}
      style={borderColor ? { borderColor } : undefined}
    >
      <span className={interactionStyles.title}>
        <span className={interactionStyles.label} data-text={label}>
          {label}
        </span>
      </span>
      <span aria-hidden="true" className={interactionStyles.ripple}>
        <span data-cta-ripple />
      </span>
    </Link>
  );
}
