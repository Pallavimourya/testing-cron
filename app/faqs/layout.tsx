import { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQs - Linkzup",
  description: "Frequently asked questions about our services and solutions.",
}

export default function FAQsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
