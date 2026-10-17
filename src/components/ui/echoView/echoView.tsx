import type { CSSProperties } from "react";
import { useId } from "react";
import styles from "./echoView.module.css";
import { type EchoViewData, resolveEchoViewData } from "./echoView.shared";
import EchoViewAnimateLoader from "./echoViewAnimateLoader";
import EchoViewMotion from "./echoViewMotion";

type EchoViewProps = {
  data: EchoViewData;
  className?: string;
  responsiveLabel?: string;
  titleOnlyBelowDesktop?: boolean;
};

export default function EchoView({
  data,
  className,
  responsiveLabel,
  titleOnlyBelowDesktop = false,
}: EchoViewProps) {
  const generatedId = useId().replace(/:/g, "");
  const resolvedData = resolveEchoViewData(data, generatedId);
  const cardViewportStyle = {
    backgroundImage: resolvedData.fallbackImage
      ? `url("${resolvedData.fallbackImage}")`
      : undefined,
  } as CSSProperties;

  return (
    <section
      className={[
        styles.echoView,
        titleOnlyBelowDesktop ? styles.titleOnlyBelowDesktop : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={resolvedData.sectionLabel}
      data-echo-view-root={resolvedData.id}
    >
      <EchoViewAnimateLoader
        data={resolvedData}
        disabledBelowDesktop={titleOnlyBelowDesktop}
      />
      <EchoViewMotion motionId={resolvedData.id}>
        <div className={styles.cardScaleWrap} data-echo-view-scale-wrap>
          <div className={styles.card} data-echo-view-card>
            <div className={styles.cardViewport} style={cardViewportStyle}>
              <canvas
                className={styles.cardCanvas}
                data-echo-view-canvas
                width={resolvedData.frameWidth}
                height={resolvedData.frameHeight}
                role="img"
                aria-label={resolvedData.frameLabel}
              />
            </div>
          </div>
        </div>

        <div className={styles.copy}>
          <span className={styles.index}>
            <span className={styles.defaultIndex}>{resolvedData.index}</span>
            {responsiveLabel ? (
              <span className={styles.responsiveIndex}>{responsiveLabel}</span>
            ) : null}
          </span>
          <h2 className={styles.title}>{resolvedData.title}</h2>
        </div>
      </EchoViewMotion>
    </section>
  );
}

export type { EchoViewData } from "./echoView.shared";
