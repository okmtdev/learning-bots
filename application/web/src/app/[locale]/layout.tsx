import { LocaleLayoutClient } from "./layout-client";

export function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return <LocaleLayoutClient params={params}>{children}</LocaleLayoutClient>;
}
