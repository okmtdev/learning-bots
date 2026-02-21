"use client";

import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRecording, deleteRecording } from "@/hooks/use-recordings";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useLocalePath, useLocaleRouter } from "@/lib/navigation";

export default function RecordingDetailContent() {
  const searchParams = useSearchParams();
  const recordingId = searchParams.get("id") ?? "";
  const { recording, isLoading } = useRecording(recordingId || null);
  const { showToast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const t = useTranslations("recording");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { localePath } = useLocalePath();
  const { push } = useLocaleRouter();

  const handleDelete = async () => {
    try {
      await deleteRecording(recordingId);
      showToast(t("deleted"), "success");
      push("/recordings");
    } catch {
      showToast(tc("deleteFailed"), "error");
    } finally {
      setShowDelete(false);
    }
  };

  if (!recordingId) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
          {t("noId")}
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
          {tc("loading")}
        </div>
      </>
    );
  }

  if (!recording) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
          {t("notFound")}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={localePath("/recordings")}
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            {t("backToList")}
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {recording.botName || t("defaultTitle")}
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              recording.status === "ready"
                ? "bg-green-100 text-green-800"
                : recording.status === "processing"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {t(`status.${recording.status}`)}
          </span>
        </div>

        {recording.status === "ready" && recording.playbackUrl && (
          <Card>
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <video
                src={recording.playbackUrl}
                controls
                className="w-full h-full"
                playsInline
              />
            </div>
          </Card>
        )}

        <Card title={t("info")}>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {t("meetingUrl")}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">
                {recording.meetingUrl}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("botName")}</dt>
              <dd className="mt-1 text-sm text-gray-900">{recording.botName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t("startedAt")}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(recording.startedAt).toLocaleString(locale)}
              </dd>
            </div>
            {recording.endedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t("endedAt")}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(recording.endedAt).toLocaleString(locale)}
                </dd>
              </div>
            )}
            {recording.durationSeconds && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t("duration")}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {t("durationFormat", {
                    min: Math.floor(recording.durationSeconds / 60),
                    sec: recording.durationSeconds % 60,
                  })}
                </dd>
              </div>
            )}
            {recording.fileSizeMb && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t("fileSize")}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {recording.fileSizeMb.toFixed(1)} MB
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <div className="mt-8 flex items-center justify-between">
          {recording.downloadUrl && (
            <a
              href={recording.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">{t("download")}</Button>
            </a>
          )}
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
