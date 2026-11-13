import type { Metadata, Viewport } from "next";
import { Besley, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/owner";
import { getDictionary } from "@/i18n";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const besley = Besley({
  variable: "--font-besley",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Toko Emas`,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Harga emas hari ini per gram dan perhiasan emas dari Toko Sinar Mas.",
  // The site is not ready for search engines until Phase 1 ships real pages.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${besley.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#isi"
          className="bg-brand text-brand-foreground sr-only z-50 rounded-md px-4 py-3 font-semibold focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          {getDictionary().common.skipToContent}
        </a>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
