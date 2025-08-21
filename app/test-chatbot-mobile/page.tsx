import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Test Chatbot Mobile - LinkZup",
  description: "Test page for chatbot mobile responsiveness",
}

export default function TestChatbotMobilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Chatbot Mobile Test
          </h1>
          <p className="text-gray-600 mb-6">
            This page is designed to test the chatbot's mobile responsiveness. 
            Try opening the chatbot on different screen sizes to see how it adapts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Test Content Cards */}
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Test Content {i + 1}
              </h3>
              <p className="text-gray-600 text-sm">
                This is sample content to test the chatbot's behavior with different 
                amounts of content on the page. The chatbot should remain accessible 
                and functional regardless of the page content.
              </p>
            </div>
          ))}
        </div>

        {/* Mobile Testing Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Mobile Testing Instructions
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>1. Toggle Button:</strong> The chatbot button should be centered at the bottom on mobile devices.</p>
            <p><strong>2. Full Screen Mode:</strong> On mobile, the chatbot should open in a full-screen overlay.</p>
            <p><strong>3. Touch Targets:</strong> All buttons and interactive elements should be large enough for comfortable touch interaction.</p>
            <p><strong>4. Responsive Text:</strong> Text should be appropriately sized for mobile reading.</p>
            <p><strong>5. Keyboard Handling:</strong> The input field should work properly with mobile keyboards.</p>
            <p><strong>6. Scroll Behavior:</strong> The message area should scroll smoothly on mobile devices.</p>
            <p><strong>7. Close Functionality:</strong> Users should be able to close the chatbot by tapping outside or the close button.</p>
          </div>
        </div>

        {/* Device Simulation Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Device Testing</h3>
          <p className="text-blue-800 text-sm">
            Test on various devices: iPhone SE (375px), iPhone 12/13/14 (390px), 
            iPhone 12/13/14 Pro Max (428px), iPad (768px), and desktop screens.
          </p>
        </div>
      </div>
    </div>
  )
}
