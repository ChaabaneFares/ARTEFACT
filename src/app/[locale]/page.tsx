import Landing from "@/components/landing/landing";
import Footer from "@/components/layout/footer/footer";
import { type LocaleParams, resolveLocale } from "@/i18n/server";

export default async function Home({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return (
    <>
      <Landing locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
