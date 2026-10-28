import { publishedContent } from "@/lib/content-store";
import { SiteContentProvider } from "@/components/cms/SiteContentProvider";
import { searchVerificationMetadata } from "@/lib/search-settings";
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://emanajewelry.com"

const baseMetadata: Metadata = {
  title: { default: "Emana Jewelry | Jewelry & Custom Designs in Ghana", template: "%s | Emana Jewelry" },
  description: "Jewelry for different styles, occasions, and budgets in Takoradi, Ghana. Explore our pieces, bring us your own design, or visit us for cleaning and repairs.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: "Emana Jewelry",
    title: "Emana Jewelry | Jewelry & Custom Designs in Ghana",
    description: "Jewelry for different styles, occasions, and budgets in Takoradi, Ghana. Explore our pieces, bring us your own design, or visit us for cleaning and repairs.",
    url: "/",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emana Jewelry | Jewelry & Custom Designs in Ghana",
    description: "Explore our jewelry, create your own design, or visit us for cleaning and repairs in Takoradi, Ghana.",
    images: ["/og-image.jpg"],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return { ...baseMetadata, verification: await searchVerificationMetadata() };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const document = await publishedContent();
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body><SiteContentProvider document={document}>{children}</SiteContentProvider></body>
    </html>
  );
}

