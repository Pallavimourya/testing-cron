"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

// Dynamically import components to prevent SSR issues
const PaymentModal = dynamic(() => import("@/components/payment-modal").then(mod => ({ default: mod.PaymentModal })))
const PlansPopup = dynamic(() => import("@/components/PlansPopup"))

export default function TestRazorpayFocusClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600">Initializing test environment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Razorpay Focus Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test Razorpay focus management and mobile responsiveness
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Test Content {i + 1}
              </h3>
              <p className="text-gray-600 text-sm">
                Sample content to test Razorpay focus behavior
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <TestPaymentModalButton />
          <TestPlansPopupButton />
        </div>
      </div>
    </div>
  )
}

function TestPaymentModalButton() {
  const [isOpen, setIsOpen] = useState(false)
  
  const testPlan = {
    id: "test-plan",
    name: "Test Plan",
    slug: "test-plan",
    description: "A test plan for focus testing",
    price: 499,
    durationDays: 15,
    features: ["Test feature 1", "Test feature 2", "Test feature 3"],
    imageLimit: 10,
    contentLimit: 50,
    isActive: true
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Test Payment Modal
      </Button>
      
      <PaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        plan={testPlan}
        userName="Test User"
        userEmail="test@example.com"
      />
    </>
  )
}

function TestPlansPopupButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        Test Plans Popup
      </Button>
      
      <PlansPopup
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}
