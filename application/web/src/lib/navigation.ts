"use client";

import { useLocale } from "next-intl";
import { useRouter as useNextRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * Build a locale-prefixed path.
 * e.g. localePath("/dashboard", "ja") => "/ja/dashboard"
 */
export function localePath(path: string, locale: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

/**
 * Hook that returns the current locale and a helper to build locale-prefixed paths.
 */
export function useLocalePath() {
  const locale = useLocale();
  const lp = useCallback(
    (path: string) => localePath(path, locale),
    [locale],
  );
  return { locale, localePath: lp };
}

/**
 * Locale-aware router.push / router.replace wrapper.
 */
export function useLocaleRouter() {
  const router = useNextRouter();
  const locale = useLocale();

  const push = useCallback(
    (path: string) => router.push(localePath(path, locale)),
    [router, locale],
  );

  const replace = useCallback(
    (path: string) => router.replace(localePath(path, locale)),
    [router, locale],
  );

  return { push, replace, locale };
}
