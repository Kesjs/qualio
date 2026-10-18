import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

/* Polices servies par next/font : sans cela, « Manrope » n'était jamais téléchargée. */
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Qualio — Transformer les avis en décisions",
  description:
    "Qualio rassemble vos avis clients, les structure par thèmes et vous aide à décider quoi améliorer.",
  keywords: ["avis clients", "feedback", "synthèse", "recommandations"],
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
    title: "Qualio — Transformer les avis en décisions",
    description: "Collectez vos avis, comprenez les thèmes qui reviennent et décidez des prochaines actions.",
    type: "website",
  },
};

import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import NextTopLoader from 'nextjs-toploader';

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
                style: {
                  background: '#1d1a18',
                  border: '1px solid #3d3a39',
                  color: '#eeeeee',
                  fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
                  fontSize: 13,
                  borderRadius: 3,
                },
              }}
            />
          </Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
