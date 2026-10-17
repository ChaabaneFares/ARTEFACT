import type { CSSProperties } from "react";
import { useId } from "react";
import FadeInImage from "@/components/ui/fadeInImage";
import ServiceSlides from "./components/service-slides/service-slides";
import styles from "./VSlider.module.css";
import VSliderAnimationsLoader from "./VSliderAnimationsLoader";
import VSliderCta from "./VSliderCta";

import type { VSliderItem, VSliderProps } from "./Vslider.types";

export type { VSliderItem } from "./Vslider.types";

function formatHrefLabel(href: string): string {
  return href.replace(/^https?:\/\//, "").replace(/^\//, "");
}

function formatTags(tags: VSliderItem["tags"]): string {
  if (!tags) {
    return "";
  }

  return typeof tags === "string" ? tags : tags.join(", ");
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function DesktopSlides({
  items,
  buttonLabel,
}: Pick<VSliderProps, "items"> & { buttonLabel: string }) {
  return (
    <section className={styles.desktopProjects}>
      <div className={styles.desktopShell}>
        <div className={styles.desktopDetails}>
          {items.map((item) => (
            <article key={item.href} className={styles.desktopProject}>
              <p
                className={styles.projectEyebrow}
                style={
                  item.accentColor ? { color: item.accentColor } : undefined
                }
              >
                <a
                  href={item.href}
                  target={isExternalHref(item.href) ? "_blank" : undefined}
                  rel={isExternalHref(item.href) ? "noreferrer" : undefined}
                >
                  {item.eyebrow ?? formatHrefLabel(item.href)}
                </a>
              </p>
              <h2 className={styles.projectTitle}>{item.title}</h2>
              <p className={styles.projectTags}>{formatTags(item.tags)}</p>
              <VSliderCta
                href={item.href}
                label={item.buttonLabel ?? buttonLabel}
                borderColor={item.accentColor}
              />
            </article>
          ))}
        </div>

        <div className={styles.desktopMedia}>
          {items.map((item, index) => (
            <div
              key={item.href}
              className={styles.desktopMediaLayer}
              style={{
                background: item.background,
                zIndex: items.length - index,
              }}
            >
              <FadeInImage
                fill
                className={styles.desktopMediaImage}
                src={item.image}
                alt={item.alt ?? item.title}
                sizes="(min-width: 1025px) 32vw, 80vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileSlides({ items }: Pick<VSliderProps, "items">) {
  return (
    <section className={styles.mobileProjects}>
      <div className={styles.mobileSticky}>
        <div className={styles.mobileImageStack}>
          {items.map((item, index) => (
            <div
              key={item.href}
              className={styles.mobileImageFrame}
              style={{ zIndex: items.length - index }}
            >
              <FadeInImage
                fill
                className={styles.mobileImage}
                src={item.image}
                alt={item.alt ?? item.title}
                sizes="(max-width: 600px) 78vw, 65vw"
              />
            </div>
          ))}
        </div>

        <div className={styles.mobileTitles}>
          {items.map((item, index) => (
            <article
              key={item.href}
              className={styles.mobileProjectDetails}
              style={{ zIndex: items.length - index }}
            >
              <a
                className={styles.mobileEyebrow}
                href={item.href}
                target={isExternalHref(item.href) ? "_blank" : undefined}
                rel={isExternalHref(item.href) ? "noreferrer" : undefined}
                style={
                  item.accentColor ? { color: item.accentColor } : undefined
                }
              >
                {item.eyebrow ?? formatHrefLabel(item.href)}
              </a>
              <h3 className={styles.mobileTitle}>{item.title}</h3>
              <p className={styles.mobileTags}>{formatTags(item.tags)}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={styles.mobilePlaceholderTrack}>
        {items.map((item) => (
          <div
            key={`${item.href}-placeholder`}
            className={styles.mobilePlaceholder}
          />
        ))}
      </div>
    </section>
  );
}

export default function VSlider({
  items,
  buttonLabel = "View more",
  className,
  compactResponsiveIntro = false,
  variant = "projects",
}: VSliderProps) {
  const sliderId = useId().replace(/:/g, "");
  const sliderStyle = {
    ["--v-slider-project-count" as string]: items.length,
    ["--v-slider-mobile-height" as string]: `${items.length * 40 + 75}vh`,
  } as CSSProperties;

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={[
        styles.slider,
        compactResponsiveIntro ? styles.compactResponsiveIntro : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={sliderStyle}
      data-vslider-id={sliderId}
    >
      {variant === "services" ? (
        <ServiceSlides items={items} buttonLabel={buttonLabel} />
      ) : (
        <>
          <DesktopSlides items={items} buttonLabel={buttonLabel} />
          <MobileSlides items={items} />
        </>
      )}
      <VSliderAnimationsLoader sliderId={sliderId} variant={variant} />
    </div>
  );
}
