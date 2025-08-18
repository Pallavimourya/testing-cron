"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isOpen && !target.closest('.mobile-menu')) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Function to handle navigation link clicks
  const handleNavigationClick = () => {
    setIsOpen(false)
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Plans", href: "/pricing" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact", href: "/contact" },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-slate-900/90 backdrop-blur-md shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/zuper-logo.png"
                alt="Linkzup Logo"
                width={56}
                height={56}
                className="h-14 w-auto transform transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-white transition-all duration-300 font-medium relative group ${
                    pathname === item.href
                      ? "text-yellow-400"
                      : "hover:text-yellow-400"
                  }`}
                >
                  {item.name}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-yellow-400 transition-all duration-300 ${
                      pathname === item.href
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  ></span>
                </Link>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="ghost" className="text-white hover:text-yellow-400 hover:bg-slate-800/50">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold px-6 py-2 rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  Sign Up
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl text-white hover:text-yellow-400 hover:bg-slate-800/50 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <>
            {/* Mobile Overlay */}
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Mobile Menu */}
            <div className="lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800/50 relative z-50 mobile-menu">
              <div className="px-6 py-6 space-y-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block transition-colors font-medium text-lg ${
                      pathname === item.href
                        ? "text-yellow-400"
                        : "text-white hover:text-yellow-400"
                    }`}
                    onClick={handleNavigationClick}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-slate-800/50 space-y-4">
                  <Link href="/signin" className="block">
                    <Button 
                      variant="ghost" 
                      className="w-full text-white hover:text-yellow-400 hover:bg-slate-800/50"
                      onClick={handleNavigationClick}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" className="block">
                    <Button 
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-2 rounded-full"
                      onClick={handleNavigationClick}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  )
}
