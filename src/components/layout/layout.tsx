import type { ReactNode } from "react";
import BrandIntro from "@/components/ui/brand-intro/brand-intro";
import Cursor from "@/components/ui/cursor/cursor";
import ScrollableContainer from "@/components/ui/scrollable-container/scrollable-container";
import type { Locale } from "@/i18n/routing";
import Header from "./header/header";
import styles from "./layout.module.css";
import PageTransition from "./page-transition/page-transition";

type LayoutProps = {
  children: ReactNode;
  locale: Locale;
};

export default function Layout({ children, locale }: LayoutProps) {
  return (
    <>
      <BrandIntro locale={locale} />
      <Cursor />
      <ScrollableContainer useWindowScroll className={styles.scrollContent}>
        <Header locale={locale} />
        {children}
      </ScrollableContainer>
      <PageTransition />
    </>
  );
}
