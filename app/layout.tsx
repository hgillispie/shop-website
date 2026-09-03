import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Bilbo_Swash_Caps,
  Style_Script,
  Big_Shoulders_Stencil,
  Architects_Daughter,
} from "next/font/google";
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

const styleScript = Style_Script({
  variable: "--font-style-script",
  subsets: ["latin"],
  weight: "400",
});

const bigShouldersStencilText = Big_Shoulders_Stencil({
  variable: "--font-big-shoulders-stencil-text",
  subsets: ["latin"],
  weight: "400",
});

const architectsDaughter = Architects_Daughter({
  variable: "--font-architects-daughter",
  subsets: ["latin"],
  weight: "400",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const TITLE = "Harley-Davidson Performance & Service in Upstate SC | Swafford Speed";
const DESCRIPTION =
  "Independent Harley-Davidson performance and service shop in Upstate SC. Power upgrades, suspension, brakes, EFI tuning, custom builds, repairs, and vintage restoration. By appointment only.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Harley-Davidson mechanic Taylors SC",
    "Harley-Davidson performance upgrades Greenville SC",
    "independent Harley-Davidson repair Greenville SC",
    "Harley mechanic Spartanburg SC",
    "Harley suspension and brake upgrades",
    "Twin Cam performance shop",
    "Milwaukee-Eight performance",
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
      className={`${geistSans.variable} ${geistMono.variable} ${bilboSwashCaps.variable} ${styleScript.variable} ${bigShouldersStencilText.variable} ${architectsDaughter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
