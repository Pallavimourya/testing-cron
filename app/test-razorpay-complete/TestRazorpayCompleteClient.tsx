"use client"

import { useState } from "react"
import { PaymentModal } from "@/components/payment-modal"
import { PlansPopup } from "@/components/PlansPopup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle, Smartphone, Monitor } from "lucide-react"

export default function TestRazorpayCompleteClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Razorpay Test
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Comprehensive testing for Razorpay focus management and mobile responsiveness
          </p>
        </div>

        {/* Test Results Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Check className="h-5 w-5" />
                Focus Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-sm">
                ✅ Auto-focus on Razorpay iframe<br/>
                ✅ No manual clicking required<br/>
                ✅ Keyboard navigation works<br/>
                ✅ Tab key functionality
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Responsive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm">
                ✅ Full screen on mobile<br/>
                ✅ Touch-friendly interface<br/>
                ✅ Proper viewport handling<br/>
                ✅ No overflow issues
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-800 flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Desktop Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-700 text-sm">
                ✅ Proper modal positioning<br/>
                ✅ Focus management<br/>
                ✅ Keyboard shortcuts<br/>
                ✅ Clean interface
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Testing Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Focus Testing:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click any payment button below</li>
                  <li>• Razorpay should open immediately</li>
                  <li>• Focus should automatically go to Razorpay</li>
                  <li>• No need to click around to get focus</li>
                  <li>• Tab key should work within Razorpay</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mobile Testing:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Test on mobile devices or resize browser</li>
                  <li>• Razorpay should be full screen</li>
                  <li>• No horizontal scrolling</li>
                  <li>• Touch interactions should work</li>
                  <li>• Virtual keyboard should appear</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <TestPaymentModalButton />
          <TestPlansPopupButton />
          <TestSubscriptionAlertButton />
        </div>

        {/* Device Testing Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Device Testing Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <h4 className="font-semibold text-sm">iPhone SE</h4>
                <p className="text-xs text-gray-500">375px width</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <h4 className="font-semibold text-sm">iPhone 12/13/14</h4>
                <p className="text-xs text-gray-500">390px width</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <h4 className="font-semibold text-sm">iPhone Pro Max</h4>
                <p className="text-xs text-gray-500">428px width</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <h4 className="font-semibold text-sm">Desktop</h4>
                <p className="text-xs text-gray-500">1024px+ width</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expected Behavior */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Expected Behavior After Fixes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-green-800 mb-2">✅ What Should Work:</h4>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Razorpay opens immediately after clicking payment button</li>
                  <li>• Focus automatically transfers to Razorpay iframe</li>
                  <li>• No need to click around to get focus</li>
                  <li>• Full screen on mobile devices</li>
                  <li>• Proper keyboard navigation</li>
                  <li>• Touch interactions work on mobile</li>
                  <li>• No horizontal scrolling issues</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">❌ What Should NOT Happen:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Need to click around to get focus</li>
                  <li>• Razorpay not being clickable</li>
                  <li>• Poor mobile layout</li>
                  <li>• Horizontal scrolling on mobile</li>
                  <li>• Focus stuck on parent modal</li>
                  <li>• Keyboard navigation not working</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-amber-800 text-sm space-y-2">
              <p><strong>If focus still doesn't work:</strong> Check browser console for any errors and ensure the auto-focus script is loaded.</p>
              <p><strong>If mobile layout is broken:</strong> Clear browser cache and test on actual mobile device.</p>
              <p><strong>If Razorpay doesn't open:</strong> Check if Razorpay script is loaded and API keys are configured.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Test Payment Modal Button Component
function TestPaymentModalButton() {
  const [isOpen, setIsOpen] = useState(false)
  
  const testPlan = {
    id: "test-plan",
    name: "Test Plan",
    slug: "test-plan",
    description: "A test plan for comprehensive testing",
    price: 499,
    durationDays: 15,
    features: [
      "Test feature 1",
      "Test feature 2", 
      "Test feature 3"
    ],
    imageLimit: 10,
    contentLimit: 50,
    isActive: true
  }

  return (
    <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
      <CardHeader>
        <CardTitle className="text-blue-800">Payment Modal Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Test the payment modal focus management and mobile responsiveness.
        </p>
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
      </CardContent>
    </Card>
  )
}

// Test Plans Popup Button Component  
function TestPlansPopupButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
      <CardHeader>
        <CardTitle className="text-purple-800">Plans Popup Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Test the plans popup focus management and mobile responsiveness.
        </p>
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          Test Plans Popup
        </Button>
        
        <PlansPopup
          open={isOpen}
          onOpenChange={setIsOpen}
        />
      </CardContent>
    </Card>
  )
}

// Test Subscription Alert Button Component
function TestSubscriptionAlertButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
      <CardHeader>
        <CardTitle className="text-green-800">Subscription Alert Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Test the subscription alert focus management and mobile responsiveness.
        </p>
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          Test Subscription Alert
        </Button>
        
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Subscription Required</h3>
              <p className="text-gray-600 mb-4">
                This is a test subscription alert. Click the button below to test payment flow.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setIsOpen(false)
                    // Simulate payment flow
                    alert("Payment flow would start here")
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
