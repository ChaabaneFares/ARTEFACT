import Link from "next/link";
import FadeInImage from "@/components/ui/fadeInImage";
import VSliderCta from "../../VSliderCta";
import type { VSliderItem } from "../../Vslider.types";
import ServiceCtaMouseArea from "./components/service-cta-mouse-area/service-cta-mouse-area";
import styles from "./service-slides.module.css";

type ServiceSlidesProps = {
  items: readonly VSliderItem[];
  buttonLabel: string;
};

export default function ServiceSlides({
  items,
  buttonLabel,
}: ServiceSlidesProps) {
  return (
    <section className={styles.showcase} data-service-slides>
      <div className={styles.details}>
        {items.map((item, index) => (
          <article key={item.href} id={item.id} className={styles.copy}>
            <span className={styles.number}>
              {`${index + 1}`.padStart(2, "0")}
            </span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <div className={styles.ctaContainer}>
              <ServiceCtaMouseArea>
                <VSliderCta
                  href={item.href}
                  label={item.buttonLabel ?? buttonLabel}
                  className={styles.cta}
                />
              </ServiceCtaMouseArea>
            </div>
          </article>
        ))}
      </div>
      <div className={styles.mediaTrack}>
        <div className={styles.media}>
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.layer}
              style={{ zIndex: items.length - index }}
              data-service-layer
              data-cursor-label={item.buttonLabel ?? buttonLabel}
            >
              <FadeInImage
                fill
                src={item.image}
                alt={item.alt ?? item.title}
                className={styles.image}
                sizes="(min-width: 769px) 32vw, 93vw"
              />
              <span className={styles.srOnly}>
                {item.linkLabel ?? `View ${item.title} projects`}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.mobile}>
        {items.map((item) => (
          <article
            key={item.href}
            id={`${item.id}-mobile`}
            className={styles.card}
          >
            <Link href={item.href} className={styles.picture}>
              <FadeInImage
                fill
                src={item.image}
                alt={item.alt ?? item.title}
                className={styles.image}
                sizes="(max-width: 768px) 93vw, 32vw"
              />
            </Link>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <VSliderCta
              href={item.href}
              label={item.buttonLabel ?? buttonLabel}
              className={styles.cta}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
