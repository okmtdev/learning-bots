import { unstable_setRequestLocale } from "next-intl/server";
import { LocaleLayoutClient } from "./layout-client";
import { getMessages, locales } from "@/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(params.locale);
  const messages = await getMessages(params.locale);

  return (
    <LocaleLayoutClient params={params} messages={messages}>
      {children}
    </LocaleLayoutClient>
  );
}
