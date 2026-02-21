"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Recording } from "@/types";

interface RecordingCardProps {
  recording: Recording;
}

const statusConfig: Record<
  Recording["status"],
  { label: string; className: string }
> = {
  processing: {
    label: "処理中",
    className: "bg-yellow-100 text-yellow-800",
  },
  ready: { label: "完了", className: "bg-green-100 text-green-800" },
  failed: { label: "失敗", className: "bg-red-100 text-red-800" },
};

function formatDuration(seconds?: number): string {
  if (seconds == null) return "-";
  const minutes = Math.round(seconds / 60);
  return `${minutes}分`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const RecordingCard = ({ recording }: RecordingCardProps) => {
  const status = statusConfig[recording.status];

  return (
    <Link href={`recordings/detail?id=${recording.recordingId}`}>
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
            <dt className="text-gray-500">Meeting URL</dt>
            <dd className="truncate font-medium text-gray-800">
              {recording.meetingUrl}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">開始日時</dt>
            <dd className="font-medium text-gray-800">
              {formatDateTime(recording.startedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">録画時間</dt>
            <dd className="font-medium text-gray-800">
              {formatDuration(recording.durationSeconds)}
            </dd>
          </div>
        </dl>
      </Card>
    </Link>
  );
};
