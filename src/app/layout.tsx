import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { themeInitScript } from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "ArchOpt — Intelligent Architectural Space & Circulation Optimizer",
    template: "%s · ArchOpt",
  },
  description:
    "ArchOpt converts architectural briefs into structured spatial requirements and searches for feasible, circulation-aware floor-plan layouts.",
  applicationName: "ArchOpt",
};

export const viewport: Viewport = {
  themeColor: "#1649d8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Inter is loaded at runtime; the font stack in globals.css falls back
            to system fonts if the request fails, so the build never depends on it. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- app-router root layout applies to every page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
