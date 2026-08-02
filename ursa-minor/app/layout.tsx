import type { Metadata } from "next";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: "200",
});

export const metadata: Metadata = {
  title: "Ursa Minor",
  description:
    "Polaris — peer-to-peer supervised fine-tuning; outcome reward for open-ended generation. A new approach to reinforcement learning from human feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} ${interTight.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[var(--night)] text-[var(--star)]">
        {children}
      </body>
    </html>
  );
}
