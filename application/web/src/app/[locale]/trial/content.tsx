"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Footer } from "@/components/layout/footer";
import { API_BASE_URL } from "@/lib/constants";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { localePath } from "@/lib/navigation";

interface ActiveBot {
  recallBotId: string;
  meetingUrl: string;
  botName: string;
  joinedAt: string;
}

export default function TrialContent() {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botName, setBotName] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeBot, setActiveBot] = useState<ActiveBot | null>(null);
  const { showToast } = useToast();
  const t = useTranslations("trial");
  const tc = useTranslations("common");
  const locale = useLocale();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    if (!meetingUrl.startsWith("https://meet.google.com/")) {
      setUrlError(t("urlError"));
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/trial/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingUrl,
          botName: botName || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error?.message || "Failed to invite bot");
      }

      const data = await response.json();
      setActiveBot({
        recallBotId: data.recallBotId,
        meetingUrl: data.meetingUrl,
        botName: data.botName,
        joinedAt: data.joinedAt,
      });
      setMeetingUrl("");
      showToast(t("invited"), "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : tc("inviteFailed"),
        "error"
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleLeave = async () => {
    if (!activeBot) return;

    setIsLeaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/trial/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recallBotId: activeBot.recallBotId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove bot");
      }

      setActiveBot(null);
      showToast(t("left"), "success");
    } catch {
      showToast(tc("leaveFailed"), "error");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={localePath("/", locale)}>
            <h1 className="text-2xl font-bold text-primary-500">Colon</h1>
          </Link>
          <span className="text-sm text-gray-500 bg-yellow-100 px-3 py-1 rounded-full font-medium">
            {t("badge")}
          </span>
        </div>
      </header>

      <main className="flex-1 bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {t("title")}
            </h2>
            <p className="text-gray-600">{t("description")}</p>
          </div>

          {/* Invite Form */}
          {!activeBot && (
            <Card title={t("inviteTitle")}>
              <form onSubmit={handleInvite} className="space-y-4">
                <Input
                  label={t("botNameLabel")}
                  placeholder={t("botNamePlaceholder")}
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  maxLength={50}
                  helperText={t("botNameHelp")}
                />
                <Input
                  label={t("meetingUrl")}
                  placeholder={t("meetingUrlPlaceholder")}
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  error={urlError}
                  helperText={t("meetingUrlHelp")}
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={isInviting}>
                    {t("submit")}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Active Bot */}
          {activeBot && (
            <Card title={t("activeSession")}>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    🤖 {activeBot.botName}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {t("status")}: {t("statusJoining")}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">{t("meetingUrl")}:</span>{" "}
                    {activeBot.meetingUrl}
                  </p>
                  <p>
                    <span className="font-medium">{t("joinedAt")}:</span>{" "}
                    {new Date(activeBot.joinedAt).toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    onClick={handleLeave}
                    loading={isLeaving}
                  >
                    {t("leave")}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">{t("notesTitle")}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• {t("note1")}</li>
              <li>• {t("note2")}</li>
              <li>• {t("note3")}</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
