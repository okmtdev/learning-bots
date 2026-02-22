import { unstable_setRequestLocale } from "next-intl/server";
import TrialContent from "./content";

export default function TrialPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return <TrialContent />;
}
