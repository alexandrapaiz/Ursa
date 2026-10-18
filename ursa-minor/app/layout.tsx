import type { Metadata, Viewport } from "next";
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

/**
 * The page is a #020308 night sky, and until today the document never said so.
 * Everything the browser paints for itself follows `color-scheme` and
 * `theme-color` rather than our CSS, so with neither declared the UA treated
 * this as a light document: rendered headed under Xvfb at 900x600, the root
 * scrollbar came out a light grey thumb on a white track, full height, hard
 * against the sky (`docs/design/reviews/2026-10-15/scheme/`). Headless
 * Chromium uses overlay scrollbars and never paints it, which is why three
 * runs of screenshots missed it. `theme-color` is the same omission one layer
 * out: it is what tints the address bar on iOS Safari and Android Chrome, and
 * undeclared leaves a white bar above a black page.
 *
 * Both values are the palette's own `--night`. Nothing new enters it.
 */
export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#020308",
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
