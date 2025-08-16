import type { Metadata } from "next"
import PricingClientPage from "./PricingClientPage"

export const metadata: Metadata = {
  title: "Plans - Linkzup",
  description: "Explore our competitive plans for digital marketing services.",
}

export default function PlansPage() {
  return <PricingClientPage />
}
