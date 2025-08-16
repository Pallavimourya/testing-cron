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
  const [datePart, timePart] = istDateTimeString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  
  // Create a date string in ISO format with IST timezone
  const istDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`
  
  // Parse the IST date string
  const istDate = new Date(istDateString)
  
  return istDate
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
