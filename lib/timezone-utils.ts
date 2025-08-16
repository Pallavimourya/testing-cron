// Utility functions for IST timezone handling

/**
 * Get current time in IST
 */
export function getCurrentISTTime(): string {
  const now = new Date()
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)) // IST is UTC+5:30
  return istTime.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
}

/**
 * Convert IST datetime string to UTC Date object
 */
export function convertISTToUTC(istDateTimeString: string): Date {
  // Parse the IST datetime string (format: YYYY-MM-DDTHH:MM)
  // When we create a Date from a string without timezone, it's treated as local time
  // Since we're working with IST, we need to handle this properly
  const istDate = new Date(istDateTimeString + ':00+05:30') // Add seconds and IST timezone
  
  // Convert to UTC
  return new Date(istDate.getTime())
}

/**
 * Convert UTC Date to IST string
 */
export function convertUTCToIST(utcDate: Date): string {
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000))
  return istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
}

/**
 * Get current time in IST as Date object
 */
export function getCurrentISTDate(): Date {
  const now = new Date()
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
}

/**
 * Check if a scheduled time is at least 5 minutes in the future (IST)
 */
export function isScheduledTimeValid(scheduledIST: string): boolean {
  const scheduledUTC = convertISTToUTC(scheduledIST)
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000))
  
  return scheduledUTC > fiveMinutesFromNow
}

/**
 * Get minimum allowed scheduling time (5 minutes from now in IST)
 */
export function getMinimumSchedulingTime(): string {
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000))
  
  // Format as IST datetime string
  const istDate = new Date(fiveMinutesFromNow.getTime() + (5.5 * 60 * 60 * 1000))
  return istDate.toISOString().slice(0, 16)
}
