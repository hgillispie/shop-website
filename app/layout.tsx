import type { Metadata } from "next";
import { Geist_Mono, Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Harley-Davidson Mechanic in Taylors, SC | Swafford Speed";
const DESCRIPTION =
  "Independent Harley-Davidson shop in Taylors, SC. Engine rebuilds, EFI tuning, vintage restoration, and custom fabrication from dealership-trained technicians. By appointment only.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Harley-Davidson mechanic Taylors SC",
    "independent Harley-Davidson repair Greenville SC",
    "Harley mechanic Spartanburg SC",
    "custom Harley fabrication",
    "vintage Harley restoration",
    "Milwaukee-Eight engine rebuild",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Swafford Speed",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
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
      data-theme="swafford"
      className={`${inter.variable} ${barlowCondensed.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
