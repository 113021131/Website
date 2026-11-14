import type { Metadata, Viewport } from "next";
import { Besley, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { allowIndexing } from "@/lib/seo";
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
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: "Harga emas hari ini per gram dan perhiasan emas dari Toko Emas Sinar Mas.",
  robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", locale: "id_ID", siteName: siteConfig.name },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // The on-screen keyboard shrinks the layout on Android, as it does on iOS.
  interactiveWidget: "resizes-content",
  // Matches the maroon header at the very top of every public page.
  themeColor: "#5e0f1f",
  // Light only: stops dark-mode browsers restyling form controls.
  colorScheme: "light",
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
