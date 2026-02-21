import { Suspense } from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import AuthCallbackContent from "./content";

export default function AuthCallbackPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">ログイン中...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
