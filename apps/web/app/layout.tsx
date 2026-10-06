import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { CreatorProfileProvider } from "@/providers/CreatorProfileProvider";
import { SettingsProvider } from "@/providers/SettingsProvider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('cinehai_settings');
                  var theme = 'dark';
                  var reduced = false;
                  var density = 'comfortable';
                  if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed && parsed.appearance) {
                      if (parsed.appearance.theme === 'light') theme = 'light';
                      else if (parsed.appearance.theme === 'system') {
                        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      }
                      if (parsed.appearance.reducedMotion) reduced = true;
                      if (parsed.appearance.density === 'compact') density = 'compact';
                    }
                  }
                  var root = document.documentElement;
                  root.setAttribute('data-theme', theme);
                  root.classList.remove('dark', 'light');
                  root.classList.add(theme);
                  if (reduced) root.setAttribute('data-reduced-motion', 'true');
                  root.setAttribute('data-density', density);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-cine-bg text-cine-text antialiased selection:bg-cine-accent selection:text-white">
        <SettingsProvider>
          <CreatorProfileProvider>
            <AppShell>{children}</AppShell>
          </CreatorProfileProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
