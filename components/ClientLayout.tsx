"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";

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
    </SessionProvider>
  );
}
