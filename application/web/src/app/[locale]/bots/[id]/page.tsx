"use client";

import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BotForm } from "@/components/features/bot-form";
import { useBot, updateBot, deleteBot } from "@/hooks/use-bots";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";
import Link from "next/link";
import type { Bot } from "@/types";

export default function BotDetailPage() {
  const params = useParams();
  const botId = params.id as string;
  const router = useRouter();
  const { bot, isLoading } = useBot(botId);
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleSubmit = async (values: Partial<Bot>) => {
    setIsSubmitting(true);
    try {
      await updateBot(botId, values);
      showToast("ボットを更新しました", "success");
    } catch {
      showToast("更新に失敗しました", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBot(botId);
      showToast("ボットを削除しました", "success");
      router.push("/ja/dashboard");
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
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/ja/dashboard"
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            ← 戻る
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                bot.status === "in_meeting"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {bot.status === "in_meeting" ? "ミーティング参加中" : "待機中"}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          ボットを編集
        </h2>

        <BotForm
          initialValues={bot}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            ボットを削除
          </Button>
        </div>
      </main>

      <Dialog
        isOpen={showDelete}
        title="ボットを削除"
        message="本当に削除しますか？この操作は取り消せません。"
        confirmLabel="削除する"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
