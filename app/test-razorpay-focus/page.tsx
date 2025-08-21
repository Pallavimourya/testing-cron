import { Metadata } from "next"
import TestRazorpayFocusClient from "./TestRazorpayFocusClient"

export const metadata: Metadata = {
  title: "Test Razorpay Focus - LinkZup",
  description: "Test page for Razorpay focus management",
}

export default function TestRazorpayFocusPage() {
  return <TestRazorpayFocusClient />
}
