import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  const services = [
    { name: "LinkZup", href: "/linkezup" },
    { name: "Consultation", href: "/contact" },
  ]

  const company = [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ]

  const resources = [
    { name: "Case Studies", href: "/case-studies" },
    { name: "Help Center", href: "/help" },
    { name: "API Documentation", href: "/docs" },
  ]

  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Image
                src="/zuper-logo.png"
                alt="Linkzup Logo"
                width={64}
                height={64}
                className="h-16 w-auto mb-6"
              />
            </Link>
            <p className="text-slate-300">
              Transform your professional identity with AI-powered personal branding.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-slate-300 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-300 hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-300 hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-300 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/services" className="text-slate-300 hover:text-white">
                  LinkedIn Branding
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-300 hover:text-white">
                  Content Creation
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-300 hover:text-white">
                  Profile Optimization
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-300 hover:text-white">
                  Engagement Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/case-studies" className="text-slate-300 hover:text-white">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-slate-300 hover:text-white">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-slate-300 hover:text-white">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-300 text-sm text-center sm:text-left">
              © {new Date().getFullYear()} Linkzup. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Link href="/privacy" className="text-slate-300 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-300 hover:text-white text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
