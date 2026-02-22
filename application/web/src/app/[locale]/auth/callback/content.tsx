"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { exchangeCodeForTokens } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "next-intl";
import { useLocaleRouter } from "@/lib/navigation";

export default function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const tc = useTranslations("common");
  const { locale } = useLocaleRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        window.location.replace(`/${locale}/`);
        return;
      }

      if (!code) {
        window.location.replace(`/${locale}/`);
        return;
      }

      try {
        await exchangeCodeForTokens(code);
        await refreshUser();
        window.location.replace(`/${locale}/dashboard`);
      } catch (err) {
        console.error("Auth failed:", err);
        window.location.replace(`/${locale}/`);
      }
    };

    handleCallback();
  }, [searchParams, locale, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{tc("loggingIn")}</p>
      </div>
    </div>
  );
}
