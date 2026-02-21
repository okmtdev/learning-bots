"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Bot } from "@/types";

interface BotCardProps {
  bot: Bot;
  onDelete: (botId: string) => void;
}

const statusConfig: Record<Bot["status"], { label: string; className: string }> = {
  idle: { label: "Idle", className: "bg-green-100 text-green-800" },
  in_meeting: { label: "In Meeting", className: "bg-blue-100 text-blue-800" },
};

export const BotCard = ({ bot, onDelete }: BotCardProps) => {
  const status = statusConfig[bot.status];

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
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Labels */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          Interactive:
          <span
            className={
              bot.isInteractiveEnabled
                ? "font-semibold text-[#6C5CE7]"
                : "font-semibold text-gray-400"
            }
          >
            {bot.isInteractiveEnabled ? "ON" : "OFF"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          Recording:
          <span
            className={
              bot.isRecordingEnabled
                ? "font-semibold text-[#00B894]"
                : "font-semibold text-gray-400"
            }
          >
            {bot.isRecordingEnabled ? "ON" : "OFF"}
          </span>
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <Link href={`/bots/${bot.botId}/edit`}>
          <Button variant="ghost" size="sm">
            編集
          </Button>
        </Link>
        <Link href={`/bots/${bot.botId}/invite`}>
          <Button variant="secondary" size="sm">
            招待
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(bot.botId)}
        >
          削除
        </Button>
      </div>
    </Card>
  );
};
