import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

/* Polices servies par next/font : sans cela, « Manrope » n'était jamais téléchargée. */
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains-mono" });

const siteUrl = "https://tryqualio.pro";
const siteTitle = "Qualio — Transformer les avis clients en décisions";
const siteDescription =
  "Qualio rassemble vos avis clients, repère les thèmes qui reviennent avec les avis à l’appui, et vous dit quoi améliorer en premier.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: "%s" },
  description: siteDescription,
  keywords: ["avis clients", "analyse d'avis", "feedback clients", "synthèse IA", "recommandations produit"],
  alternates: { canonical: "/" },
  applicationName: "Qualio",
  icons: {
    icon: [
      { url: "/qualio-logo/export/icon/icon-orange-obsidian-512.png", sizes: "512x512", type: "image/png" },
      { url: "/qualio-logo/export/icon/icon-orange-obsidian-192.png", sizes: "192x192", type: "image/png" },
      { url: "/qualio-logo/export/icon/icon-orange-obsidian-32.png", sizes: "32x32", type: "image/png" },
      { url: "/qualio-logo/export/icon/icon-orange-obsidian-16.png", sizes: "16x16", type: "image/png" },
      { url: "/qualio-logo/export/icon/icon-orange-obsidian.svg", type: "image/svg+xml" },
    ],
    shortcut: "/qualio-logo/export/icon/icon-orange-obsidian-512.png",
    apple: [
      { url: "/qualio-logo/export/icon/icon-orange-obsidian-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "Qualio",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/social/qualio-og.png", width: 1200, height: 630, alt: "Qualio — des clients plus satisfaits grâce à leurs propres avis" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/social/qualio-og.png"],
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import NextTopLoader from 'nextjs-toploader';
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-white text-gray-900 dark:bg-black dark:text-[#eeeeee] antialiased"
        style={{
          fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif"
        }}
      >
        <LanguageProvider>
          <Providers>
            <NextTopLoader color="#ee6018" showSpinner={false} height={2} />
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'qualio-toast',
                style: {
                  fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
                  fontSize: 13,
                  borderRadius: 3,
                },
              }}
            />
          </Providers>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
