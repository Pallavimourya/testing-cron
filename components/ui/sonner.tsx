"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-green-600 group-[.toaster]:border-border group-[.toaster]:shadow-sm group-[.toaster]:rounded-lg group-[.toaster]:p-3 group-[.toaster]:min-w-[280px] group-[.toaster]:max-w-[350px]",
          description: "group-[.toast]:text-green-500",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: {
          background: theme === 'dark' ? '#1f2937' : '#ffffff',
          color: '#16a34a', // Green color for all notification text
          border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          fontSize: '14px',
          fontWeight: '400',
          transform: 'translateZ(0)', // Hardware acceleration
          willChange: 'transform, opacity', // Optimize for animations
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
