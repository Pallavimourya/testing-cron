// Utility functions for timezone conversion
export function convertISTToUTC(istDateString: string): Date {
  // Parse the IST date string and convert to UTC
  const istDate = new Date(istDateString)

  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
  const utcTime = istDate.getTime() - istOffset

  return new Date(utcTime)
}

export function convertUTCToIST(utcDate: Date): string {
  // Convert UTC date to IST string
  const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
  const istTime = new Date(utcDate.getTime() + istOffset)

  return istTime.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function formatDateForScheduling(date: Date): string {
  // Format date for datetime-local input
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getCurrentISTTime(): string {
  const now = new Date()
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return formatDateForScheduling(istTime)
}
