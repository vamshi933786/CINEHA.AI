import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "CINEHA AI — Intelligent Content Creation Assistant",
  description: "AI-Powered Multi-Agent Short-Form Content Creation Platform for Reels, TikTok, and Shorts",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080B11",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cine-bg text-cine-text antialiased selection:bg-cine-accent selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
