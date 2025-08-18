"use client"

import { useState, useEffect } from "react"

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  currentBreakpoint: Breakpoint
  width: number
  height: number
}

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isWide: false,
    currentBreakpoint: "xs",
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      let currentBreakpoint: Breakpoint = "xs"
      for (const [breakpoint, minWidth] of Object.entries(breakpoints)) {
        if (width >= minWidth) {
          currentBreakpoint = breakpoint as Breakpoint
        }
      }

      setState({
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints.xl,
        isWide: width >= breakpoints.xl,
        currentBreakpoint,
        width,
        height,
      })
    }

    // Set initial state
    updateResponsiveState()

    // Add event listener
    window.addEventListener("resize", updateResponsiveState)

    // Cleanup
    return () => window.removeEventListener("resize", updateResponsiveState)
  }, [])

  return state
}

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { isMobile } = useResponsive()

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(!isOpen)

  // Auto-close on desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  return {
    isOpen,
    open,
    close,
    toggle,
    isMobile,
  }
}

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const checkTouchDevice = () => {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
      setIsTouchDevice(isTouch)
    }

    checkTouchDevice()
  }, [])

  return isTouchDevice
}

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    let ticking = false

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > scrollY) {
        setScrollDirection("down")
      } else if (currentScrollY < scrollY) {
        setScrollDirection("up")
      }

      setScrollY(currentScrollY)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll)

    return () => window.removeEventListener("scroll", onScroll)
  }, [scrollY])

  return scrollDirection
}

export function useViewportSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateSize()
    window.addEventListener("resize", updateSize)

    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return size
}

export function useBreakpoint(breakpoint: Breakpoint) {
  const { currentBreakpoint } = useResponsive()
  const breakpointIndex = Object.keys(breakpoints).indexOf(breakpoint)
  const currentIndex = Object.keys(breakpoints).indexOf(currentBreakpoint)

  return currentIndex >= breakpointIndex
}

export function useResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T,
  wide?: T
): T {
  const { isMobile, isTablet, isDesktop, isWide } = useResponsive()

  if (isWide && wide !== undefined) return wide
  if (isDesktop && desktop !== undefined) return desktop
  if (isTablet && tablet !== undefined) return tablet
  return mobile
}

export function useResponsiveClass(
  mobileClass: string,
  tabletClass?: string,
  desktopClass?: string,
  wideClass?: string
): string {
  const { isMobile, isTablet, isDesktop, isWide } = useResponsive()

  if (isWide && wideClass) return wideClass
  if (isDesktop && desktopClass) return desktopClass
  if (isTablet && tabletClass) return tabletClass
  return mobileClass
}
