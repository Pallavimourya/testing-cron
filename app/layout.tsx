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
          src="/razorpay-auto-focus.js" 
          strategy="afterInteractive"
          id="razorpay-auto-focus"
        />
      </body>
    </html>
  )
}
