import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colon - カスタマイズ可能なインタラクティブボットサービス",
  description:
    "Google Meetに招待できるカスタマイズ可能なリアルタイムインタラクティブボットサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
