import { Suspense } from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import BotInviteContent from "./content";

export default function BotInvitePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <Suspense>
      <BotInviteContent />
    </Suspense>
  );
}
