// app/layout.tsx
import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

// Configure the font with SWC compatibility
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false, // Helps with SWC compatibility
})

export const metadata: Metadata = {
  title: "TOKI CONNECT - Language Learning Platform",
  description: "Connect with language teachers from around the world",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        Google Tag Manager (GTM) Head Snippet - Part 1
        Paste this code as high in the <head> of the page as possible.
        For Next.js App Router, this means directly inside the <html> tag, before <body>.
        You might use a <head> component or just place it directly as shown.
        Make sure to replace GTM-N7KZSZC with your actual GTM_ID if it's different.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-N7KZSZC');
          `,
        }}
      />

      <body className={inter.className}>
        {/*
          Google Tag Manager (GTM) Body Snippet - Part 2
          Paste this code immediately after the opening <body> tag.
          Make sure to replace GTM-N7KZSZC with your actual GTM_ID if it's different.
        */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `
              <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N7KZSZC"
              height="0" width="0" style="display:none;visibility:hidden"></iframe>
            `,
          }}
        />

        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
