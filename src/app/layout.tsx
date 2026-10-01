import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qualio — Your Website QA Workspace",
  description:
    "Stop reading raw logs. Qualio runs real Playwright crawls, captures evidence, and uses AI to transform browser errors into actionable diagnostics with impact severity.",
  keywords: ["QA", "website testing", "Playwright", "AI diagnosis", "web monitoring"],
  openGraph: {
    title: "Qualio — Your Website QA Workspace",
    description: "Real browser interactions. AI-powered diagnosis. Continuous QA for your website.",
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
