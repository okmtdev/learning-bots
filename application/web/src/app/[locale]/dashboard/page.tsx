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

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { bots, isLoading: botsLoading, mutate: mutateBots } = useBots();
  const { recordings, isLoading: recordingsLoading } = useRecordings({ limit: 3 });
  const { showToast } = useToast();
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center text-gray-500">
          読み込み中...
        </div>
      </>
    );
  }

  const handleDeleteBot = async () => {
    if (!deletingBotId) return;
    try {
      await deleteBot(deletingBotId);
      await mutateBots();
      showToast("ボットを削除しました", "success");
    } catch {
      showToast("削除に失敗しました", "error");
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
          こんにちは、{user?.displayName || "ゲスト"}さん！
        </h2>

        {/* Bots Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              あなたのボット
            </h3>
            <Link href="/ja/bots/new">
              <Button size="sm">+ 新しいボット</Button>
            </Link>
          </div>

          {botsLoading ? (
            <p className="text-gray-500">読み込み中...</p>
          ) : bots.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">🤖</div>
              <p className="text-gray-500 mb-4">
                まだボットがありません。最初のボットを作成しましょう！
              </p>
              <Link href="/ja/bots/new">
                <Button>ボットを作成</Button>
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
              最近の録画
            </h3>
            <Link href="/ja/recordings" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
              すべての録画を見る →
            </Link>
          </div>

          {recordingsLoading ? (
            <p className="text-gray-500">読み込み中...</p>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">📹</div>
              <p className="text-gray-500">
                まだ録画がありません。ボットを招待して録画を始めましょう！
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
        isOpen={!!deletingBotId}
        title="ボットを削除"
        message="本当に削除しますか？この操作は取り消せません。"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={handleDeleteBot}
        onCancel={() => setDeletingBotId(null)}
      />
    </>
  );
}
