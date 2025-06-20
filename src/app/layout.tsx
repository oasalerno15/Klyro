import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import CookieConsent from "@/components/CookieConsent";

// Configure Inter with all weights for more versatile styling
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.kly-ro.xyz'),
  title: "Klyro - Financial Wellness Through Smart Tracking",
  description: "Track expenses, analyze spending patterns, and achieve financial goals with AI-powered insights and personalized financial calendars.",
  keywords: ["finance", "expense tracking", "budgeting", "financial wellness", "AI insights"],
  authors: [{ name: "Klyro Team" }],
  creator: "Klyro",
  publisher: "Klyro",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "Klyro - Financial Wellness Platform",
    description: "Track expenses, analyze spending patterns, and achieve financial goals with AI-powered insights.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.kly-ro.xyz',
    siteName: "Klyro",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Klyro Financial Wellness Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Klyro - Financial Wellness Platform",
    description: "Track expenses and achieve financial goals with AI-powered insights.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="text/javascript"
          src="https://s3.tradingview.com/tv.js"
          async
        ></script>
      </head>
      <body className={`${inter.className} antialiased font-sans`}>
        <AuthProvider>
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
