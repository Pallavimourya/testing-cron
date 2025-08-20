"use client"

import { useEffect, useState } from 'react'

interface PerformanceMonitorProps {
  componentName: string
}

export function PerformanceMonitor({ componentName }: PerformanceMonitorProps) {
  const [loadTime, setLoadTime] = useState<number | null>(null)

  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      setLoadTime(duration)
      
      // Log performance data in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} loaded in ${duration.toFixed(2)}ms`)
      }
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production' && duration > 1000) {
        // Log slow components
        console.warn(`⚠️ Slow component: ${componentName} took ${duration.toFixed(2)}ms to load`)
      }
    }
  }, [componentName])

  return null
}

