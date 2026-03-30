import type { Metadata } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { AppShell } from "./app-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Claude Config Generator — Configure Claude Code en 2 minutes",
    template: "%s | Claude Config Generator",
  },
  description: "Générateur visuel de configuration pour Claude Code. Wizard guidé, éditeur expert, permissions, hooks, MCP servers — télécharge un ZIP prêt à déposer dans ton projet.",
  keywords: ["Claude Code", "configuration", "CLAUDE.md", "settings.json", "MCP", "hooks", "permissions", "AI coding"],
  openGraph: {
    title: "Claude Config Generator",
    description: "Configure Claude Code en 2 minutes — permissions, hooks, MCP servers, rules. Télécharge un ZIP prêt à l'emploi.",
    type: "website",
    siteName: "Claude Config Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Config Generator",
    description: "Configure Claude Code en 2 minutes — permissions, hooks, MCP servers, rules.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
