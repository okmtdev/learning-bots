"use client";

import { Header } from "@/components/layout/header";
import { RecordingCard } from "@/components/features/recording-card";
import { useRecordings } from "@/hooks/use-recordings";
import { useBots } from "@/hooks/use-bots";
import { useState } from "react";

export default function RecordingsPage() {
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const { recordings, isLoading } = useRecordings(
    selectedBotId || undefined,
    50
  );
  const { bots } = useBots();

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">録画一覧</h2>
          <select
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">すべてのボット</option>
            {bots?.map((bot) => (
              <option key={bot.botId} value={bot.botId}>
                {bot.botName}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : !recordings || recordings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">録画はまだありません</p>
            <p className="text-sm text-gray-400">
              ボットをミーティングに招待すると、録画が自動的に保存されます
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recordings.map((recording) => (
              <RecordingCard key={recording.recordingId} recording={recording} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
