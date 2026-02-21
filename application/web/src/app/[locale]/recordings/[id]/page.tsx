"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useRecording, deleteRecording } from "@/hooks/use-recordings";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function RecordingDetailPage() {
  const params = useParams();
  const recordingId = params.id as string;
  const { recording, isLoading } = useRecording(recordingId);
  const { showToast } = useToast();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteRecording(recordingId);
      showToast("録画を削除しました", "success");
      router.push("/ja/recordings");
    } catch {
      showToast("削除に失敗しました", "error");
    } finally {
      setShowDelete(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
          読み込み中...
        </div>
      </>
    );
  }

  if (!recording) {
    return (
      <>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
          録画が見つかりません
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
            href="/ja/recordings"
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            ← 録画一覧に戻る
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {recording.meetingTitle || "ミーティング録画"}
          </h2>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              recording.status === "completed"
                ? "bg-green-100 text-green-800"
                : recording.status === "processing"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {recording.status === "completed"
              ? "完了"
              : recording.status === "processing"
              ? "処理中"
              : "失敗"}
          </span>
        </div>

        {/* Video Player */}
        {recording.status === "completed" && recording.playbackUrl && (
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

        {/* Recording Info */}
        <Card title="録画情報">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                ミーティングURL
              </dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">
                {recording.meetingUrl}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ボットID</dt>
              <dd className="mt-1 text-sm text-gray-900">{recording.botId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">開始日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(recording.startedAt).toLocaleString("ja-JP")}
              </dd>
            </div>
            {recording.endedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500">終了日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(recording.endedAt).toLocaleString("ja-JP")}
                </dd>
              </div>
            )}
            {recording.durationSeconds && (
              <div>
                <dt className="text-sm font-medium text-gray-500">長さ</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {Math.floor(recording.durationSeconds / 60)}分
                  {recording.durationSeconds % 60}秒
                </dd>
              </div>
            )}
            {recording.fileSizeBytes && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  ファイルサイズ
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(recording.fileSizeBytes / 1024 / 1024).toFixed(1)} MB
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Transcript */}
        {recording.transcript && recording.transcript.length > 0 && (
          <Card title="文字起こし">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recording.transcript.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                    {Math.floor(entry.timestamp / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(entry.timestamp % 60).toString().padStart(2, "0")}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      {entry.speaker}
                    </span>
                    <p className="text-sm text-gray-900">{entry.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          {recording.downloadUrl && (
            <a
              href={recording.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary">ダウンロード</Button>
            </a>
          )}
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            録画を削除
          </Button>
        </div>
      </main>

      <Dialog
        isOpen={showDelete}
        title="録画を削除"
        message="本当に削除しますか？この操作は取り消せません。"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
