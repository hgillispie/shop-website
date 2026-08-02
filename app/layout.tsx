import type { Metadata } from "next";
import { Geist, Geist_Mono, Bilbo_Swash_Caps } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bilboSwashCaps = Bilbo_Swash_Caps({
  variable: "--font-bilbo-swash-caps",
  subsets: ["latin"],
  weight: "400",
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
      className={`${geistSans.variable} ${geistMono.variable} ${bilboSwashCaps.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
