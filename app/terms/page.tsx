export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold mb-8 text-white">
          Terms of Service
        </h1>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
          <p className="text-lg text-slate-300 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Services</h2>
              <p className="text-slate-300">
                linkzup provides LinkedIn personal branding services to help businesses and professionals grow their online presence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. User Responsibilities</h2>
              <p className="text-slate-300">
                Users are responsible for maintaining the accuracy of their information and complying with LinkedIn's terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Privacy</h2>
              <p className="text-slate-300">
                We collect and process personal information in accordance with our Privacy Policy and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
              <p className="text-slate-300">
                All content, designs, and materials provided through our services remain the property of linkzup or our clients.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
              <p className="text-slate-300">
                linkzup is not liable for any indirect, incidental, or consequential damages arising from the use of our services.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
