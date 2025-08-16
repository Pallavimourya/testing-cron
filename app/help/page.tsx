export default function HelpPage() {
  const faqs = [
    {
      question: "How do I get started?",
      answer: "Getting started is easy! Simply contact us through our website or LinkedIn, and our team will guide you through the onboarding process."
    },
    {
      question: "What's included in the LinkedIn personal branding service?",
      answer: "Our LinkedIn personal branding service includes profile optimization, content strategy, network growth, and engagement management to help you build a strong professional presence."
    },
    {
      question: "How long does it take to see results?",
      answer: "Most clients start seeing improvements in their LinkedIn engagement within 2-4 weeks, with more significant results appearing after 3-6 months of consistent effort."
    },
    {
      question: "Do you offer custom packages?",
      answer: "Yes, we offer custom packages tailored to your specific needs. Contact our sales team to discuss your requirements."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold mb-8 text-white">
          Help Center
        </h1>
        <div className="grid md:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-slate-700/50 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                  <p className="text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Contact Support */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-6 text-white">Contact Support</h2>
            <p className="text-slate-300 mb-8">
              Need help? Our support team is here for you. Choose your preferred method of contact below.
            </p>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Email Support</h3>
                  <p className="text-slate-300">support@linkzup</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Phone Support</h3>
                  <p className="text-slate-300">+91 7697624256</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Live Chat</h3>
                  <p className="text-slate-300">Available 24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
