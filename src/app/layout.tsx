import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display: a light, high-contrast editorial serif — reads expensive at large
// sizes without the default-grotesk look.
const displaySerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// Technical mono for kickers, labels, nav and spec-sheet micro-copy.
const jetMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marque.studio"),
  title: {
    default: "Marque — Design & Engineering Studio",
    template: "%s — Marque",
  },
  description:
    "Marque is a design and engineering studio. We take digital products from first line to finished surface — strategy, interface, and code, built to a finer tolerance.",
  openGraph: {
    title: "Marque — Design & Engineering Studio",
    description:
      "A design and engineering studio taking digital products from first line to finished surface.",
    url: "https://marque.studio",
    siteName: "Marque",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marque — Design & Engineering Studio",
    description:
      "A design and engineering studio taking digital products from first line to finished surface.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${jetMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">{children}</body>
    </html>
  );
}
