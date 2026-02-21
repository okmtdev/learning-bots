"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForTokens } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export default function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        router.push("/ja");
        return;
      }

      if (!code) {
        router.push("/ja");
        return;
      }

      try {
        await exchangeCodeForTokens(code);
        await refreshUser();
        router.push("/ja/dashboard");
      } catch (err) {
        console.error("Token exchange failed:", err);
        router.push("/ja");
      }
    };

    handleCallback();
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">ログイン中...</p>
      </div>
    </div>
  );
}
