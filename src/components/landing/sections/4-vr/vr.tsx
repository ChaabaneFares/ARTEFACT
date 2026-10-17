import { intlLocale } from "@/i18n/format";
import { LANDING_VR_SCENE_ID } from "@/lib/landingVr/vr.shared";
import type { LandingSectionProps } from "../../landing.types";
import VirtualTour from "./components/virtual-tour/virtual-tour";
import { vrCopy } from "./vr.copy";
import styles from "./vr.module.css";
import VrAnimateLoader from "./vrAnimateLoader";
import VrSceneLoader from "./vrSceneLoader";

export default function Vr({ locale }: LandingSectionProps) {
  const copy = vrCopy[locale];
  const tourLabels = {
    ...copy.tour,
    title: copy.tour.title.replace(
      "{degrees}",
      new Intl.NumberFormat(intlLocale(locale)).format(360),
    ),
  };
  return (
    <section
      id="vr"
      className={styles.vr}
      data-vr-id={LANDING_VR_SCENE_ID}
      aria-label={copy.section}
    >
      <VrAnimateLoader sceneId={LANDING_VR_SCENE_ID} />
      <div className={styles.sceneStage}>
        <div
          className={styles.sceneScrollMount}
          data-vr-scene-mount={LANDING_VR_SCENE_ID}
        >
          <VrSceneLoader
            sceneId={LANDING_VR_SCENE_ID}
            headsetLabel={copy.headset}
            sceneLabel={copy.scene}
          />
        </div>
      </div>
      <VirtualTour labels={tourLabels} dragLabel={copy.drag} />
    </section>
  );
}
