import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const SITE = "https://stackcleaner.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Stack Cleaner: see & organize your Claude setup",
    template: "%s · Stack Cleaner",
  },
  description:
    "A free tool to see, organize, and clean up your Claude skills, plugins, MCP servers, and agents, split by global vs. project. Runs locally, sends nothing.",
  keywords: ["Claude", "Claude Code", "skills", "plugins", "MCP", "agents", "inventory", "cleanup"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Stack Cleaner",
    description:
      "See and organize every Claude skill, plugin, MCP server, and agent: global vs. project. Free, local, private.",
    url: SITE,
    siteName: "Stack Cleaner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stack Cleaner",
    description: "See and organize your Claude skills, plugins, MCP servers, and agents.",
  },
  // Icons come from file conventions: app/icon.svg + app/apple-icon.
};

export const viewport: Viewport = {
  themeColor: "#faf7f1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
