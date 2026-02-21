"use client";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BotForm } from "@/components/features/bot-form";
import { useBot, updateBot, deleteBot } from "@/hooks/use-bots";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";
import Link from "next/link";
import type { Bot } from "@/types";
import { useTranslations } from "next-intl";
import { useLocalePath, useLocaleRouter } from "@/lib/navigation";

export default function BotDetailContent() {
  const searchParams = useSearchParams();
  const botId = searchParams.get("id") ?? "";
  const { bot, isLoading } = useBot(botId || null);
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const t = useTranslations("bot");
  const tc = useTranslations("common");
  const { localePath } = useLocalePath();
  const { push } = useLocaleRouter();

  const handleSubmit = async (values: Partial<Bot>) => {
    setIsSubmitting(true);
    try {
      await updateBot(botId, values);
      showToast(t("updated"), "success");
    } catch {
      showToast(tc("updateFailed"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBot(botId);
      showToast(t("deleted"), "success");
      push("/dashboard");
    } catch {
      showToast(tc("deleteFailed"), "error");
    } finally {
      setShowDelete(false);
    }
  };

  if (!botId) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          {t("noBotId")}
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          {tc("loading")}
        </div>
      </>
    );
  }

  if (!bot) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          {t("notFound")}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={localePath("/dashboard")}
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            {tc("back")}
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                bot.status === "in_meeting"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {t(`status.${bot.status}`)}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          {t("edit")}
        </h2>

        <BotForm
          initialValues={bot}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            {t("delete")}
          </Button>
        </div>
      </main>

      <Dialog
        open={showDelete}
        title={t("delete")}
        confirmLabel={t("deleteAction")}
        cancelLabel={tc("cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)}
      >
        {t("deleteConfirm")}
      </Dialog>
    </>
  );
}
