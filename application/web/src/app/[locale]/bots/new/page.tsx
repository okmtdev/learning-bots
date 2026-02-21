"use client";

import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BotForm } from "@/components/features/bot-form";
import { createBot } from "@/hooks/use-bots";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import Link from "next/link";
import type { Bot } from "@/types";

export default function NewBotPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: Partial<Bot>) => {
    setIsSubmitting(true);
    try {
      await createBot(values);
      showToast("ボットを作成しました", "success");
      router.push("/ja/dashboard");
    } catch {
      showToast("作成に失敗しました", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/ja/dashboard"
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            ← 戻る
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          新しいボットを作成
        </h2>
        <BotForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>
    </>
  );
}
