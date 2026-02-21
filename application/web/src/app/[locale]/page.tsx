"use client";

import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useLocaleRouter } from "@/lib/navigation";

export default function LandingPage() {
  const { login, isLoggedIn } = useAuth();
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const { replace } = useLocaleRouter();

  if (isLoggedIn) {
    if (typeof window !== "undefined") {
      replace("/dashboard");
    }
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-500">Colon</h1>
          <Button variant="ghost" onClick={login}>
            {tc("login")}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 whitespace-pre-line">
            {t("hero.title")}
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <Button size="lg" onClick={login}>
            {t("hero.cta")}
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                {t("features.summary.title")}
              </h3>
              <p className="text-gray-600">
                {t("features.summary.description")}
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                {t("features.topics.title")}
              </h3>
              <p className="text-gray-600">
                {t("features.topics.description")}
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                {t("features.recording.title")}
              </h3>
              <p className="text-gray-600">
                {t("features.recording.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            {t("steps.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <p className="text-lg font-medium text-gray-800">
                {t("steps.step1")}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <p className="text-lg font-medium text-gray-800">
                {t("steps.step2")}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <p className="text-lg font-medium text-gray-800">
                {t("steps.step3")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
