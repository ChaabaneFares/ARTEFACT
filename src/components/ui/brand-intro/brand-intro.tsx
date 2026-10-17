import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import BrandIntroClient from "./brand-intro.client";
import { brandIntroCopy } from "./brand-intro.copy";
import styles from "./brand-intro.module.css";

export default function BrandIntro({ locale }: { locale: Locale }) {
  const copy = brandIntroCopy[locale];
  return (
    <BrandIntroClient label={copy.label}>
      <div className={styles.inner} aria-hidden="true">
        <div className={styles.brand}>
          <span>{copy.caption}</span>
          <Image
            className={styles.wordmark}
            src="/assets/brand/vawzen-wordmark-horizontal.svg"
            alt="Vawzen"
            width={98}
            height={15}
            priority
            unoptimized
          />
        </div>
        <div className={styles.track}>
          <div className={styles.fill} />
        </div>
      </div>
    </BrandIntroClient>
  );
}
