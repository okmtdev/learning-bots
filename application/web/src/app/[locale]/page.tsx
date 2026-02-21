"use client";

import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { login, isLoggedIn } = useAuth();

  if (isLoggedIn) {
    if (typeof window !== "undefined") {
      window.location.href = "/ja/dashboard";
    }
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-500">Colon</h1>
          <Button variant="ghost" onClick={login}>
            ログイン
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            あなたのミーティングを、
            <br />
            もっと鮮やかに。
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Colonは、Google Meetに招待できるカスタマイズ可能なインタラクティブボットサービスです。
            会議の要約、話題の提供、録画まで、あなた好みに設定できます。
          </p>
          <Button size="lg" onClick={login}>
            Googleでログイン
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                会議の要約
              </h3>
              <p className="text-gray-600">
                チャットの呼び出しに応じて、会議や会話の要約を自動で投稿します。
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                話題の提供
              </h3>
              <p className="text-gray-600">
                会話の流れからネクストアクションに向けた情報を自動で調べて話題を提供します。
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                録画機能
              </h3>
              <p className="text-gray-600">
                重要な会議や1on1を録画して、いつでも見返すことができます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            かんたん3ステップ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <p className="text-lg font-medium text-gray-800">
                Googleアカウントでログイン
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <p className="text-lg font-medium text-gray-800">
                ボットをカスタマイズ
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <p className="text-lg font-medium text-gray-800">
                ミーティングに招待
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
