import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "自分専用チャットメモ",
  description: "超シンプルな自分専用チャットメモアプリ",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-icon"
  },
  appleWebApp: {
    capable: true,
    title: "チャットメモ",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#f8f9fb"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
