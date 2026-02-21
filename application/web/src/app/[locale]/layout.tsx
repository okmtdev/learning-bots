import { LocaleLayoutClient } from "./layout-client";
import { getMessages } from "@/i18n";

export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages(params.locale);

  return (
    <LocaleLayoutClient params={params} messages={messages}>
      {children}
    </LocaleLayoutClient>
  );
}
