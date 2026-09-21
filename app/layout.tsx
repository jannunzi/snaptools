import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getSiteUrl, siteDescription, siteName, siteTagline } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — tiny free tools`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "free tools",
    "practice sheets",
    "multiplication tables",
    "music note recognition",
    "spelling practice",
    "printable coloring",
    "civics quiz",
    "division facts",
    "telling time",
    "counting money",
    "addition facts",
    "subtraction facts",
    "history timeline",
    "world history",
    "states and capitals",
    "US geography",
    "first communion",
    "catechism",
    "parts of the mass",
    "eucharist",
    "USCIS",
    "treble clef",
    "browser tools",
    "no account",
    "interactive fraction wall",
    "fraction bars",
    "area vs perimeter interactive",
    "same perimeter different area",
  ],
  openGraph: {
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: `${siteName} — ${siteTagline}`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body
        className={`${inter.className} flex min-h-dvh flex-col antialiased`}
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
