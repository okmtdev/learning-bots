import { Suspense } from "react";
import BotDetailContent from "./content";

export default function BotDetailPage() {
  return (
    <Suspense>
      <BotDetailContent />
    </Suspense>
  );
}
