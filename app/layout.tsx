import type React from "react"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import ClientLayout from "@/components/ClientLayout"
const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Script
          src="https://cdn.pulse.is/livechat/loader.js"
          data-live-chat-id="6836ed8a4ab6ec1a4a0c8f68"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  )
}
