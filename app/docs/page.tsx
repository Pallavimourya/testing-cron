export default function DocsPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          API Documentation
        </h1>
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-bold mt-8 mb-4">Getting Started</h2>
          <p className="text-gray-300">
            Welcome to the linkzup API documentation. This guide will help you integrate our services into your applications.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Authentication</h2>
          <div className="bg-slate-800 p-4 rounded-lg">
            <pre className="text-gray-300">
              <code>
                {`curl -X POST https://api.linkzup/v1/auth \\
  -H "Content-Type: application/json" \\
  -d '{"api_key": "your_api_key"}'`}
              </code>
            </pre>
          </div>
          
          {/* Add more API documentation sections here */}
        </div>
      </div>
    </div>
  )
}
