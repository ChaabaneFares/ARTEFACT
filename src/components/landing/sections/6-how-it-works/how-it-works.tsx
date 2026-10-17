import {
  getHowItWorksAssets,
  LANDING_HOW_IT_WORKS_SCENE_ID,
} from "@/lib/howItWorks3d/howItWorks.shared";
import type { LandingSectionProps } from "../../landing.types";
import { howItWorksCopy } from "./how-it-works.copy";
import styles from "./how-it-works.module.css";
import HowItWorksAnimateLoader from "./howItWorksAnimateLoader";
import HowItWorksSceneLoader from "./howItWorksSceneLoader";

export default function HowItWorks({ locale }: LandingSectionProps) {
  const copy = howItWorksCopy[locale];
  return (
    <section
      id="how-it-works"
      className={styles.howItWorks}
      data-how-it-works-id={LANDING_HOW_IT_WORKS_SCENE_ID}
      aria-label={copy.section}
    >
      <HowItWorksAnimateLoader sceneId={LANDING_HOW_IT_WORKS_SCENE_ID} />
      <div className={styles.sceneStage}>
        <div
          className={styles.sceneScrollMount}
          data-how-it-works-scene-mount={LANDING_HOW_IT_WORKS_SCENE_ID}
        >
          <HowItWorksSceneLoader
            sceneId={LANDING_HOW_IT_WORKS_SCENE_ID}
            assets={getHowItWorksAssets(locale)}
            imageLabel={copy.title}
            sceneLabel={copy.scene}
          />
        </div>
      </div>
    </section>
  );
}
