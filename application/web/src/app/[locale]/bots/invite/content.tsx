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

export default function BotInviteContent() {
  const searchParams = useSearchParams();
  const botId = searchParams.get("id") ?? "";
  const { bot, isLoading, mutate } = useBot(botId || null);
  const { showToast } = useToast();
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [urlError, setUrlError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError("");

    if (!meetingUrl.startsWith("https://meet.google.com/")) {
      setUrlError("有効な Google Meet のURLを入力してください");
      return;
    }

    setIsInviting(true);
    try {
      await inviteBot(botId, meetingUrl);
      showToast("ボットを招待しました", "success");
      setMeetingUrl("");
      await mutate();
    } catch {
      showToast("招待に失敗しました", "error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveBot(botId);
      showToast("ボットを退出させました", "success");
      await mutate();
    } catch {
      showToast("退出に失敗しました", "error");
    } finally {
      setIsLeaving(false);
    }
  };

  if (!botId) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          ボットIDが指定されていません
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          読み込み中...
        </div>
      </>
    );
  }

  if (!bot) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-500">
          ボットが見つかりません
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
            href="../dashboard"
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            ← 戻る
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ボットを招待
        </h2>
        <p className="text-gray-600 mb-8">
          🤖 {bot.botName} をミーティングに招待
        </p>

        {bot.status !== "in_meeting" && (
          <Card title="ミーティングに招待">
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Google Meet URL"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                error={urlError}
                helperText="Google Meet のURLを貼り付けてください"
              />
              <div className="flex justify-end gap-3">
                <Link href="../dashboard">
                  <Button variant="ghost" type="button">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" loading={isInviting}>
                  招待する
                </Button>
              </div>
            </form>
          </Card>
        )}

        {bot.currentSession && (
          <Card title="現在参加中のミーティング">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {bot.currentSession.meetingUrl}
              </p>
              <p className="text-sm text-gray-500">
                参加開始:{" "}
                {new Date(bot.currentSession.joinedAt).toLocaleString("ja-JP")}
              </p>
              <Button
                variant="danger"
                size="sm"
                onClick={handleLeave}
                loading={isLeaving}
              >
                退出させる
              </Button>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
