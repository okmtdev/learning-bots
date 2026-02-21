import { Suspense } from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import BotDetailContent from "./content";

export default function BotDetailPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <Suspense>
      <BotDetailContent />
    </Suspense>
  );
}
