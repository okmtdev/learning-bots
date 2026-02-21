"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export const Footer = () => {
  const t = useTranslations("common");

  return (
    <footer className="bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <Link
            href="#"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("termsOfService")}
          </Link>
          <Link
            href="#"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("privacyPolicy")}
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">© 2026 Colon</p>
      </div>
    </footer>
  );
};
