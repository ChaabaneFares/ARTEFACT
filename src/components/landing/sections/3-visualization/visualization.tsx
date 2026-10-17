import EchoView from "@/components/ui/echoView/echoView";
import { buildEchoViewFrameSources } from "@/components/ui/echoView/echoView.shared";
import VSlider from "@/components/ui/VSlider/Vslider";
import { intlLocale } from "@/i18n/format";
import type { LandingSectionProps } from "../../landing.types";
import { visualizationCopy } from "./visualization.copy";
import { getVisualizationItems } from "./visualization.data";
import styles from "./visualization.module.css";

const VISUALIZATION_ECHO_VIEW = {
  id: "visualization",
  frameSources: buildEchoViewFrameSources(
    "/assets/landing-page/visualization/echo-view",
    41,
  ),
};

export default function Visualization({ locale }: LandingSectionProps) {
  const copy = visualizationCopy[locale];
  const index = new Intl.NumberFormat(intlLocale(locale), {
    minimumIntegerDigits: 2,
  }).format(2);
  return (
    <section id="visualization" className={styles.visualization}>
      <EchoView
        data={{
          ...VISUALIZATION_ECHO_VIEW,
          title: copy.title,
          sectionLabel: copy.sectionLabel,
          frameLabel: copy.frameLabel,
          index,
        }}
        responsiveLabel={copy.responsiveLabel}
        titleOnlyBelowDesktop
      />
      <VSlider
        items={getVisualizationItems(locale)}
        buttonLabel={copy.buttonLabel}
        compactResponsiveIntro
      />
    </section>
  );
}
