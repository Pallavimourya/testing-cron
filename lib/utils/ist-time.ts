// IST Time utility for handling Indian Standard Time

export class ISTTime {
  /**
   * Get current UTC time
   */
  static getCurrentUTC(): Date {
    return new Date()
  }

  /**
   * Get current IST time as Date object
   */
  static getCurrentIST(): Date {
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000 // IST is UTC+5:30
    return new Date(now.getTime() + istOffset)
  }

  /**
   * Get current IST time as formatted string
   */
  static getCurrentISTString(): string {
    const istTime = this.getCurrentIST()
    return istTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  }

  /**
   * Convert IST datetime string to UTC Date
   */
  static convertISTToUTC(istDateTimeString: string): Date {
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
  static convertUTCToIST(utcDate: Date): string {
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000))
    return istDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  }

  /**
   * Check if a scheduled time is at least 5 minutes in the future (IST)
   */
  static isScheduledTimeValid(scheduledIST: string): boolean {
    const scheduledUTC = this.convertISTToUTC(scheduledIST)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000))
    
    return scheduledUTC > fiveMinutesFromNow
  }

  /**
   * Get minimum allowed scheduling time (5 minutes from now in IST)
   */
  static getMinimumSchedulingTime(): string {
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + (5 * 60 * 1000))
    
    // Format as IST datetime string
    const istDate = new Date(fiveMinutesFromNow.getTime() + (5.5 * 60 * 60 * 1000))
    return istDate.toISOString().slice(0, 16)
  }
}
