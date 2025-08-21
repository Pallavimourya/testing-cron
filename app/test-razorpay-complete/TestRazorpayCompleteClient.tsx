"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Dynamically import components to prevent SSR issues
const PaymentModal = dynamic(() => import("@/components/payment-modal").then(mod => ({ default: mod.PaymentModal })))
const PlansPopup = dynamic(() => import("@/components/PlansPopup"))

export default function TestRazorpayCompleteClient() {
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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Razorpay Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Comprehensive testing for Razorpay focus management, mobile responsiveness, and logo display
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="bg-white shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Test Content {i + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Sample content to test Razorpay behavior across different scenarios
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <TestSection 
            title="Payment Modal Test" 
            description="Test the PaymentModal component with focus management"
            component={<TestPaymentModalButton />}
          />
          
          <TestSection 
            title="Plans Popup Test" 
            description="Test the PlansPopup component with focus management"
            component={<TestPlansPopupButton />}
          />
          
          <TestSection 
            title="Subscription Alert Test" 
            description="Test the SubscriptionAlert component with focus management"
            component={<TestSubscriptionAlertButton />}
          />
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expected Behavior</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="text-xs">1</Badge>
              <span>Razorpay should open with auto-focus on the payment form</span>
            </div>
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="text-xs">2</Badge>
              <span>Razorpay should be full-screen and responsive on mobile devices</span>
            </div>
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="text-xs">3</Badge>
              <span>LinkZup logo should display correctly in Razorpay interface</span>
            </div>
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="text-xs">4</Badge>
              <span>No interaction conflicts with parent modals</span>
            </div>
            <div className="flex items-start space-x-2">
              <Badge variant="outline" className="text-xs">5</Badge>
              <span>Proper cleanup when Razorpay is dismissed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TestSection({ title, description, component }: { title: string; description: string; component: React.ReactNode }) {
  return (
    <Card className="bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardHeader>
      <CardContent>
        {component}
      </CardContent>
    </Card>
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

function TestSubscriptionAlertButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Test Subscription Alert
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Subscription Alert Test</h3>
            <p className="text-gray-600 mb-4">
              This simulates a subscription alert that would trigger Razorpay.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setIsOpen(false)
                  // Simulate subscription alert trigger
                  setTimeout(() => {
                    const event = new CustomEvent('subscription-alert', {
                      detail: { planId: 'zuper30' }
                    })
                    window.dispatchEvent(event)
                  }, 100)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Trigger Payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
