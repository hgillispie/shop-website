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
const TITLE =
  "Harley-Davidson Performance & Custom Shop in Taylors, SC | Swafford Speed";
const DESCRIPTION =
  "Harley-Davidson performance upgrades, custom and club-style builds, suspension and brakes, EFI tuning, and service in Taylors, SC. Dealership-trained, by appointment only.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Harley-Davidson performance shop Taylors SC",
    "Harley performance upgrades Greenville SC",
    "club style Harley build South Carolina",
    "Milwaukee-Eight cams and tuning",
    "Harley suspension and brake upgrades",
    "custom Harley fabrication",
    "vintage Harley restoration",
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
