import type { Metadata, Viewport } from "next";
import { Syne, Lora, Noto_Sans_Ethiopic } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
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

// Renders the fidel characters in the Fidel index view and its TopBar pill icon.
const notoEthiopic = Noto_Sans_Ethiopic({
  weight: ["400"],
  subsets: ["ethiopic"],
  variable: "--font-noto-ethiopic",
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
  keywords: ['Ethiopian script', 'Ge-ez', 'Ethiopic', 'Fidel', 'Amharic', 'AI art', 'AI image generation', 'Ethiopia', 'Geez script', 'AI photography'],
  metadataBase: new URL('https://aitiopia.com'),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'AItiopia',
    description: 'No face. No filter. Just the letters.',
    url: 'https://aitiopia.com',
    siteName: 'AItiopia',
    type: 'website',
    locale: 'en_ET',
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
    // suppressHydrationWarning: theme-init.js intentionally rewrites data-theme
    // before hydration (saved theme may be 'light'), so server/client differ.
    <html lang="en-ET" data-theme="dark" suppressHydrationWarning className={`${syne.variable} ${lora.variable} ${notoEthiopic.variable}`}>
      <body>
        {/*
          External file: no dangerouslySetInnerHTML, so React 19 does not warn.
          Runs before hydration to apply the saved theme without a flash.
        */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
