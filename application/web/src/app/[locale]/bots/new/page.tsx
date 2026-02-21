"use client";

import { Header } from "@/components/layout/header";
import { BotForm } from "@/components/features/bot-form";
import { createBot } from "@/hooks/use-bots";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import Link from "next/link";
import type { Bot } from "@/types";
import { useTranslations } from "next-intl";
import { useLocalePath, useLocaleRouter } from "@/lib/navigation";

export default function NewBotPage() {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("bot");
  const tc = useTranslations("common");
  const { localePath } = useLocalePath();
  const { push } = useLocaleRouter();

  const handleSubmit = async (values: Partial<Bot>) => {
    setIsSubmitting(true);
    try {
      await createBot(values);
      showToast(t("created"), "success");
      push("/dashboard");
    } catch {
      showToast(tc("createFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={localePath("/dashboard")}
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            {tc("back")}
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          {t("create")}
        </h2>
        <BotForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>
    </>
  );
}
