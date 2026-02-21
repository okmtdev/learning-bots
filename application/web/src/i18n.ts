import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";

export const locales = ["ja", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ja";

export async function getMessages(locale: string): Promise<AbstractIntlMessages> {
  try {
    return (await import(`./messages/${locale}.json`)).default;
  } catch {
    return (await import(`./messages/${defaultLocale}.json`)).default;
  }
}

export default getRequestConfig(async ({ locale }) => ({
  messages: await getMessages(locale),
}));
