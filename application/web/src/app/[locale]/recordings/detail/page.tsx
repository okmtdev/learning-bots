import { Suspense } from "react";
import { unstable_setRequestLocale } from "next-intl/server";
import RecordingDetailContent from "./content";

export default function RecordingDetailPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <Suspense>
      <RecordingDetailContent />
    </Suspense>
  );
}
