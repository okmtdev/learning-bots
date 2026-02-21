"use client";

import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/components/ui/toast";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";

export function LocaleLayoutClient({
  children,
  params,
  messages,
}: {
  children: React.ReactNode;
  params: { locale: string };
  messages: AbstractIntlMessages;
}) {
  return (
    <html lang={params.locale}>
      <body className="min-h-screen bg-gray-50 font-sans">
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
