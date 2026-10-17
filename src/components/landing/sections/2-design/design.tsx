import EchoView from "@/components/ui/echoView/echoView";
import { buildEchoViewFrameSources } from "@/components/ui/echoView/echoView.shared";
import VSlider from "@/components/ui/VSlider/Vslider";
import { intlLocale } from "@/i18n/format";
import type { LandingSectionProps } from "../../landing.types";
import { designCopy } from "./design.copy";
import { getDesignItems } from "./design.data";
import styles from "./design.module.css";

const DESIGN_ECHO_VIEW = {
  id: "design",
  frameSources: buildEchoViewFrameSources(
    "/assets/landing-page/designs/echo-view",
    41,
  ),
};

export default function Design({ locale }: LandingSectionProps) {
  const copy = designCopy[locale];
  const index = new Intl.NumberFormat(intlLocale(locale), {
    minimumIntegerDigits: 2,
  }).format(1);
  return (
    <section id="projects" className={styles.design}>
      <EchoView
        data={{
          ...DESIGN_ECHO_VIEW,
          title: copy.title,
          sectionLabel: copy.sectionLabel,
          frameLabel: copy.frameLabel,
          index,
        }}
        responsiveLabel={copy.responsiveLabel}
        titleOnlyBelowDesktop
      />
      <VSlider
        items={getDesignItems(locale)}
        buttonLabel={copy.buttonLabel}
        compactResponsiveIntro
      />
    </section>
  );
}
