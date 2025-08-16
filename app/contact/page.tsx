import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Mail, MessageCircle, Clock, Star, Linkedin, ArrowRight, MessageSquare } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Contact - linkzup",
  description: "Get in touch with our team to discuss your digital growth needs",
}

export default function ContactPage() {
  const contactMethods = [
    {
      title: "Email",
              description: "Send us an email and we&apos;ll get back to you within 24 hours.",
      icon: <Mail className="h-6 w-6" />,
      link: "mailto:zuperprashant@gmail.com",
      buttonText: "Send Email"
    },
    {
      title: "LinkedIn",
      description: "Connect with us on LinkedIn for professional networking.",
      icon: <Linkedin className="h-6 w-6" />,
      link: "https://www.linkedin.com/in/prashant-kumar-a00000000/",
      buttonText: "Connect on LinkedIn"
    },
    {
      title: "WhatsApp",
      description: "Chat with us on WhatsApp for quick responses and support.",
      icon: <MessageSquare className="h-6 w-6" />,
      link: "https://wa.me/917697624256",
      buttonText: "Chat on WhatsApp"
    },
  ]

  const officeHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
    { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ]

  const serviceOptions = [
    { value: "LinkZup", label: "LinkZup - LinkedIn Personal Branding" },
    { value: "consultation", label: "Consultation" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <Star className="w-4 h-4 mr-2 animate-spin-slow" />
              Let&apos;s Connect
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Transform Your Digital Presence
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Ready to elevate your online impact? We&apos;re here to help you succeed. Get in touch and let&apos;s discuss how
              we can transform your digital strategy.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
      <Link href="/services"> {/* ← yahan aap desired path daal sakte hain */}
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full">
          Get Started <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Choose Your Preferred Contact Method</h2>
            <p className="text-xl text-slate-300">We&apos;re here to help you succeed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-500/50"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform duration-300">
                  {method.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{method.title}</h3>
                <p className="text-slate-300 mb-4 text-sm">{method.description}</p>
                <Link href={method.link} target="_blank">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white group-hover:shadow-lg transition-all duration-300 text-sm">
                    {method.buttonText}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Contact Form and Info */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
              <h2 className="text-2xl font-bold text-white mb-2">Send us a Message</h2>
              <p className="text-slate-300 mb-8">Fill out the form below and we'll get back to you within 24 hours</p>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="text-white">First Name *</Label>
                    <Input 
                      id="first-name" 
                      placeholder="John" 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 transition-all duration-300" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="text-white">Last Name *</Label>
                    <Input 
                      id="last-name" 
                      placeholder="Doe" 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 transition-all duration-300" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 transition-all duration-300" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+91 9876543210" 
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 transition-all duration-300" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service" className="text-white">Service Interest</Label>
                  <select className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300">
                    <option value="">Select a service</option>
                    {serviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your goals and how we can help you..."
                    rows={5}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg rounded-xl transition-all duration-300 hover:shadow-lg" 
                >
                  Send Message
                </Button>

                <p className="text-xs text-slate-400 text-center">
                  We'll respond to your inquiry within 24 hours during business days.
                </p>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Office Hours */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-400" />
                  Office Hours
                </h3>
                <div className="space-y-4">
                  {officeHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300">
                      <span className="text-slate-300">{schedule.day}</span>
                      <span className="font-semibold text-white">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                  Our Location
                </h3>
                <p className="text-slate-300 mb-4">
                  Indore, Madhya Pradesh, India
                </p>
                <div className="bg-slate-700/50 rounded-lg h-48 flex items-center justify-center hover:bg-slate-700/70 transition-all duration-300">
                  <span className="text-slate-400">Interactive Map</span>
                </div>
              </div>

              {/* Quick Response */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold mb-2">Need Immediate Help?</h3>
                <p className="mb-6 text-white/90">
                  For urgent inquiries, reach out via LinkedIn for the fastest response.
                </p>
                <Link href="https://www.linkedin.com/in/prashant-kumar-a00000000/" target="_blank">
                  <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 transition-all duration-300">
                    <Linkedin className="h-4 w-4 mr-2" />
                    Connect on LinkedIn
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-300">Quick answers to common questions</p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How quickly can you start working on my project?",
                answer:
                  "We typically begin new projects within 3-5 business days after onboarding. For urgent requests, we offer expedited setup within 24-48 hours.",
              },
              {
                question: "Do you offer custom packages?",
                answer:
                  "Yes! While we have standard packages, we're happy to create custom solutions based on your specific needs and budget.",
              },
              {
                question: "What's included in the onboarding process?",
                answer:
                  "Our onboarding includes strategy consultation, account setup, content planning, and training on our processes. You'll have a dedicated account manager throughout.",
              },
              {
                question: "Can I cancel or modify my service anytime?",
                answer:
                  "Yes, our services are flexible. You can modify your package or cancel with 30 days notice. We believe in earning your business every month.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
              >
                <h3 className="font-semibold text-xl text-white mb-3">{faq.question}</h3>
                <p className="text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
