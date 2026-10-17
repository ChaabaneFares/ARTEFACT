"use client";

import { useFooterAnimateLoader } from "./footerAnimateLoader.logic";

export default function FooterAnimateLoader() {
  const AnimateComponent = useFooterAnimateLoader();
  return AnimateComponent ? <AnimateComponent /> : null;
}
