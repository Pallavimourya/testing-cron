"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full"
  padding?: "none" | "sm" | "md" | "lg" | "xl"
  spacing?: "none" | "sm" | "md" | "lg" | "xl"
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
}

const paddingClasses = {
  none: "",
  sm: "px-2 sm:px-4",
  md: "px-4 sm:px-6",
  lg: "px-6 sm:px-8",
  xl: "px-8 sm:px-12",
}

const spacingClasses = {
  none: "",
  sm: "space-y-2 sm:space-y-4",
  md: "space-y-4 sm:space-y-6",
  lg: "space-y-6 sm:space-y-8",
  xl: "space-y-8 sm:space-y-12",
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "7xl",
  padding = "md",
  spacing = "none",
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
  gap?: "sm" | "md" | "lg" | "xl"
}

const gapClasses = {
  sm: "gap-2 sm:gap-4",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-12",
}

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = "md",
}: ResponsiveGridProps) {
  const gridCols = `grid-cols-${cols.mobile || 1} sm:grid-cols-${cols.tablet || 2} lg:grid-cols-${cols.desktop || 3} xl:grid-cols-${cols.wide || 4}`

  return (
    <div className={cn("grid", gridCols, gapClasses[gap], className)}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "gradient" | "glass"
  padding?: "sm" | "md" | "lg" | "xl"
}

const cardVariants = {
  default: "bg-white border border-gray-200 shadow-sm",
  gradient: "bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-lg",
  glass: "bg-white/80 backdrop-blur-sm border-0 shadow-lg",
}

const cardPadding = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
  xl: "p-8 sm:p-12",
}

export function ResponsiveCard({
  children,
  className,
  variant = "default",
  padding = "md",
}: ResponsiveCardProps) {
  return (
    <div className={cn("rounded-xl", cardVariants[variant], cardPadding[padding], className)}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption"
  weight?: "normal" | "medium" | "semibold" | "bold"
}

const textVariants = {
  h1: "text-xl sm:text-2xl lg:text-3xl font-bold",
  h2: "text-lg sm:text-xl lg:text-2xl font-semibold",
  h3: "text-base sm:text-lg lg:text-xl font-medium",
  h4: "text-sm sm:text-base lg:text-lg font-medium",
  body: "text-sm sm:text-base",
  caption: "text-xs sm:text-sm",
}

const textWeights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
}

export function ResponsiveText({
  children,
  className,
  variant = "body",
  weight = "normal",
}: ResponsiveTextProps) {
  return (
    <div className={cn(textVariants[variant], textWeights[weight], className)}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps {
  children: React.ReactNode
  className?: string
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  onClick?: () => void
  disabled?: boolean
}

const buttonVariants = {
  primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
  outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
  ghost: "hover:bg-gray-100 text-gray-700",
}

const buttonSizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm sm:text-base",
  lg: "px-6 py-3 text-base sm:text-lg",
}

export function ResponsiveButton({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  onClick,
  disabled = false,
}: ResponsiveButtonProps) {
  return (
    <button
      className={cn(
        "rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
