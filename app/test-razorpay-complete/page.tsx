import { Metadata } from "next"
import TestRazorpayCompleteClient from "./TestRazorpayCompleteClient"

export const metadata: Metadata = {
  title: "Complete Razorpay Test - LinkZup",
  description: "Comprehensive test page for Razorpay focus and mobile responsiveness",
}

export default function TestRazorpayCompletePage() {
  return <TestRazorpayCompleteClient />
}
