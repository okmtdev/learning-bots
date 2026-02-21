import { Suspense } from "react";
import BotInviteContent from "./content";

export default function BotInvitePage() {
  return (
    <Suspense>
      <BotInviteContent />
    </Suspense>
  );
}
