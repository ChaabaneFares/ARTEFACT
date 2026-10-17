import Link from "next/link";
import { localizePath } from "@/i18n/routing";
import { LANDING_PROCESS_SECTION_ID } from "@/lib/landingProcess/process.shared";
import type { LandingSectionProps } from "../../landing.types";
import { processCopy } from "./process.copy";
import { getProcessItems } from "./process.data";
import styles from "./process.module.css";
import ProcessAnimateLoader from "./processAnimateLoader";
import ProcessSceneLoader from "./processSceneLoader";

export default function Process({ locale }: LandingSectionProps) {
  const copy = processCopy[locale];
  return (
    <section
      id="process"
      className={styles.process}
      data-process-id={LANDING_PROCESS_SECTION_ID}
      aria-label={copy.section}
    >
      <ProcessAnimateLoader sectionId={LANDING_PROCESS_SECTION_ID} />
      <div className={styles.processHead} />
      <div className={styles.processGrid}>
        {getProcessItems(locale).map((item) => {
          const isRightVariant = item.variant === "right";

          return (
            <div
              key={item.sceneId}
              className={styles.processCol}
              data-process-card
              data-process-scene-mount={item.sceneId}
            >
              <div className={styles.processContent} data-process-card-content>
                {!isRightVariant ? (
                  <div className={styles.processVid} data-process-illustration>
                    <ProcessSceneLoader
                      sceneId={item.sceneId}
                      sceneUrl={item.sceneUrl}
                      objectId={item.objectId}
                      mobileImageUrl={item.mobileImageUrl}
                      staticImageUrl={item.staticImageUrl}
                      materialOverride={item.materialOverride}
                      useStaticScene={item.useStaticScene}
                      label={item.title}
                    />
                  </div>
                ) : null}

                {isRightVariant ? (
                  <>
                    <div
                      className={`${styles.processText} ${styles.processTextRight}`}
                    >
                      <Link href={localizePath("/contact", locale)}>
                        <h5>
                          <span>{item.number}</span>
                          {item.title}
                        </h5>
                      </Link>
                      <p>{item.description}</p>
                    </div>
                    <div
                      className={`${styles.processVid} ${styles.processVidRight}`}
                      data-process-illustration
                    >
                      <ProcessSceneLoader
                        sceneId={item.sceneId}
                        sceneUrl={item.sceneUrl}
                        objectId={item.objectId}
                        mobileImageUrl={item.mobileImageUrl}
                        staticImageUrl={item.staticImageUrl}
                        materialOverride={item.materialOverride}
                        useStaticScene={item.useStaticScene}
                        label={item.title}
                        variant="right"
                      />
                    </div>
                    <div
                      className={`${styles.processText} ${styles.processTextMobile}`}
                    >
                      <Link href={localizePath("/contact", locale)}>
                        <span>{item.number}</span>
                        <h5>{item.title}</h5>
                      </Link>
                      <p>{item.description}</p>
                    </div>
                  </>
                ) : (
                  <div className={styles.processText}>
                    <Link href={localizePath("/contact", locale)}>
                      <span>{item.number}</span>
                      <h5>{item.title}</h5>
                    </Link>
                    <p>{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
