import type { Metadata, Viewport } from "next";
import { Syne, Lora } from "next/font/google";
import "./globals.css";

const syne = Syne({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const lora = Lora({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#06060F',
}

export const metadata: Metadata = {
  title: 'AItiopia — Experimental image generation',
  description:
    'No face. No filter. Just the letters. 2,500 years of Ethiopian script, finally impossible to ignore.',
  metadataBase: new URL('https://aitiopia.com'),
  openGraph: {
    title: 'AItiopia',
    description: 'No face. No filter. Just the letters.',
    url: 'https://aitiopia.com',
    siteName: 'AItiopia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AItiopia',
    description: 'No face. No filter. Just the letters.',
    site: '@aitiopia',
    creator: '@aitiopia',
  },
  alternates: {
    canonical: 'https://aitiopia.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ET" className={`${syne.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
