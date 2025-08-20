"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import Chatbot from "@/components/chatbot";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin-dashboard") || pathname.startsWith("/admin");

  return (
    <SessionProvider>
      {!isDashboard && <Navigation />}
      <main>{children}</main>
      {!isDashboard && <Footer />}
      {!isDashboard && <Chatbot />}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  );
}
