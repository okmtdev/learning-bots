"use client";

import { useAuth } from "@/hooks/use-auth";
import { useBots, deleteBot } from "@/hooks/use-bots";
import { useRecordings } from "@/hooks/use-recordings";
import { Header } from "@/components/layout/header";
import { BotCard } from "@/components/features/bot-card";
import { RecordingCard } from "@/components/features/recording-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocalePath } from "@/lib/navigation";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { bots, isLoading: botsLoading, mutate: mutateBots } = useBots();
  const { recordings, isLoading: recordingsLoading } = useRecordings({ limit: 3 });
  const { showToast } = useToast();
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const t = useTranslations("dashboard");
  const tb = useTranslations("bot");
  const tc = useTranslations("common");
  const { localePath } = useLocalePath();

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-500">
          {tc("loading")}
        </div>
      </>
    );
  }

  const handleDeleteBot = async () => {
    if (!deletingBotId) return;
    try {
      await deleteBot(deletingBotId);
      await mutateBots();
      showToast(tb("deleted"), "success");
    } catch {
      showToast(tc("deleteFailed"), "error");
    } finally {
      setDeletingBotId(null);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Greeting */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          {t("greeting", { name: user?.displayName || t("guestName") })}
        </h2>

        {/* Bots Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {t("yourBots")}
            </h3>
            <Link href={localePath("/bots/new")}>
              <Button size="sm">{t("newBot")}</Button>
            </Link>
          </div>

          {botsLoading ? (
            <p className="text-gray-500">{tc("loading")}</p>
          ) : bots.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-500 mb-4">
                {t("noBots")}
              </p>
              <Link href={localePath("/bots/new")}>
                <Button>{t("createBot")}</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bots.map((bot) => (
                <BotCard
                  key={bot.botId}
                  bot={bot}
                  onDelete={() => setDeletingBotId(bot.botId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Recordings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {t("recentRecordings")}
            </h3>
            <Link href={localePath("/recordings")} className="text-primary-500 hover:text-primary-600 text-sm font-medium">
              {t("viewAll")}
            </Link>
          </div>

          {recordingsLoading ? (
            <p className="text-gray-500">{tc("loading")}</p>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-gray-500">
                {t("noRecordings")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recordings.map((rec) => (
                <RecordingCard key={rec.recordingId} recording={rec} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deletingBotId}
        title={tb("delete")}
        confirmLabel={tb("deleteAction")}
        cancelLabel={tc("cancel")}
        variant="danger"
        onConfirm={handleDeleteBot}
        onClose={() => setDeletingBotId(null)}
      >
        {tb("deleteConfirm")}
      </Dialog>
    </>
  );
}
