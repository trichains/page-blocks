import type { Metadata } from "next";
import { Fraunces, Inter, Space_Grotesk } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Page Blocks", template: "%s" },
  description: "Schema-driven landing page engine: JSON documents, typed blocks, a generated editor and static output.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${grotesk.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
