"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Bot } from "@/types";
import { useTranslations } from "next-intl";
import { useLocalePath } from "@/lib/navigation";

interface BotCardProps {
  bot: Bot;
  onDelete: (botId: string) => void;
}

export const BotCard = ({ bot, onDelete }: BotCardProps) => {
  const t = useTranslations("bot");
  const tc = useTranslations("common");
  const { localePath } = useLocalePath();

  const statusClassName =
    bot.status === "in_meeting"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";

  return (
    <Card className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="bot">
            🤖
          </span>
          <h3 className="text-lg font-semibold text-gray-900">
            {bot.botName}
          </h3>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName}`}
        >
          {t(`status.${bot.status}`)}
        </span>
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          {t("interactive")}:
          <span
            className={
              bot.isInteractiveEnabled
                ? "font-semibold text-[#6C5CE7]"
                : "font-semibold text-gray-400"
            }
          >
            {bot.isInteractiveEnabled ? tc("on") : tc("off")}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          {t("recording")}:
          <span
            className={
              bot.isRecordingEnabled
                ? "font-semibold text-[#00B894]"
                : "font-semibold text-gray-400"
            }
          >
            {bot.isRecordingEnabled ? tc("on") : tc("off")}
          </span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <Link href={localePath(`/bots/detail?id=${bot.botId}`)}>
          <Button variant="ghost" size="sm">
            {tc("edit")}
          </Button>
        </Link>
        <Link href={localePath(`/bots/invite?id=${bot.botId}`)}>
          <Button variant="secondary" size="sm">
            {t("invite")}
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(bot.botId)}
        >
          {tc("delete")}
        </Button>
      </div>
    </Card>
  );
};
