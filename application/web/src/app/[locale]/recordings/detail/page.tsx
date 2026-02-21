import { Suspense } from "react";
import RecordingDetailContent from "./content";

export default function RecordingDetailPage() {
  return (
    <Suspense>
      <RecordingDetailContent />
    </Suspense>
  );
}
