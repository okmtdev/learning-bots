import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colon - 本格カスタマイズ可能なインタラクティブボットサービス",
  description:
    "本格カスタマイズ可能なリアルタイムインタラクティブボットサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
