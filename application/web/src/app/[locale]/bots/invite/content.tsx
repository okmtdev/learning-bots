"use client";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useBot, inviteBot, leaveBot } from "@/hooks/use-bots";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useLocalePath } from "@/lib/navigation";

export default function BotInviteContent() {
  const searchParams = useSearchParams();
  const botId = searchParams.get("id") ?? "";
  const { bot, isLoading, mutate } = useBot(botId || null);
  const { showToast } = useToast();
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [urlError, setUrlError] = useState("");
  const t = useTranslations("invite");
  const tb = useTranslations("bot");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { localePath } = useLocalePath();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    if (!meetingUrl.startsWith("https://meet.google.com/")) {
      setUrlError(t("urlError"));
      return;
    }

    setIsInviting(true);
    try {
      await inviteBot(botId, meetingUrl);
      showToast(t("invited"), "success");
      setMeetingUrl("");
      await mutate();
    } catch {
      showToast(tc("inviteFailed"), "error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveBot(botId);
      showToast(t("left"), "success");
      await mutate();
    } catch {
      showToast(tc("leaveFailed"), "error");
    } finally {
      setIsLeaving(false);
    }
  };

  if (!botId) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          {tb("noBotId")}
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
          {tb("notFound")}
        </div>
      </>
    );
  }

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

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t("title")}
        </h2>
        <p className="text-gray-600 mb-8">
          {t("description", { name: bot.botName })}
        </p>

        {bot.status !== "in_meeting" && (
          <Card title={t("inviteToMeeting")}>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label={t("meetingUrl")}
                placeholder={t("meetingUrlPlaceholder")}
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                error={urlError}
                helperText={t("meetingUrlHelp")}
              />
              <div className="flex justify-end gap-3">
                <Link href={localePath("/dashboard")}>
                  <Button variant="ghost" type="button">
                    {tc("cancel")}
                  </Button>
                </Link>
                <Button type="submit" loading={isInviting}>
                  {t("submit")}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {bot.currentSession && (
          <Card title={t("currentSession")}>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {bot.currentSession.meetingUrl}
              </p>
              <p className="text-sm text-gray-500">
                {t("joinedAt")}:{" "}
                {new Date(bot.currentSession.joinedAt).toLocaleString(locale)}
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={handleLeave}
                loading={isLeaving}
              >
                {t("leave")}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
