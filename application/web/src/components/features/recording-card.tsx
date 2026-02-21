"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Recording } from "@/types";
import { useTranslations, useLocale } from "next-intl";
import { useLocalePath } from "@/lib/navigation";

interface RecordingCardProps {
  recording: Recording;
}

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const RecordingCard = ({ recording }: RecordingCardProps) => {
  const t = useTranslations("recording");
  const locale = useLocale();
  const { localePath } = useLocalePath();

  const statusConfig: Record<
    Recording["status"],
    { label: string; className: string }
  > = {
    processing: {
      label: t("status.processing"),
      className: "bg-yellow-100 text-yellow-800",
    },
    ready: { label: t("status.ready"), className: "bg-green-100 text-green-800" },
    failed: { label: t("status.failed"), className: "bg-red-100 text-red-800" },
  };

  const status = statusConfig[recording.status];

  const durationMinutes =
    recording.durationSeconds != null
      ? Math.round(recording.durationSeconds / 60)
      : null;

  return (
    <Link href={localePath(`/recordings/detail?id=${recording.recordingId}`)}>
      <Card className="transition-shadow hover:shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="recording">
              📹
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {recording.botName}
            </h3>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Details */}
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">{t("meetingUrl")}</dt>
            <dd className="truncate font-medium text-gray-800">
              {recording.meetingUrl}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("startedAt")}</dt>
            <dd className="font-medium text-gray-800">
              {formatDateTime(recording.startedAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("duration")}</dt>
            <dd className="font-medium text-gray-800">
              {durationMinutes != null
                ? t("durationMinutes", { min: durationMinutes })
                : "-"}
            </dd>
          </div>
        </dl>
      </Card>
    </Link>
  );
};
