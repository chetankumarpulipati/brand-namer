import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brand Namer — AI-Powered Brand Name Generation",
  description:
    "Generate unique, memorable brand names with AI. Check domain availability, trademark conflicts, and social media handles. The ultimate naming platform for startups and businesses.",
  keywords: "brand name generator, business name generator, AI naming, startup name, domain search",
  openGraph: {
    title: "Brand Namer — AI-Powered Brand Name Generation",
    description: "Generate unique, memorable brand names with AI-powered technology.",
    url: "https://brandnamer.com",
    siteName: "Brand Namer",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Namer — AI-Powered Brand Name Generation",
    description: "Generate unique, memorable brand names with AI.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
