import { format, parseISO, addMinutes } from "date-fns"
import * as dateFnsTz from "date-fns-tz"

const IST_TIMEZONE = "Asia/Kolkata"

export class ISTTime {
  /**
   * Convert IST date to UTC for database storage
   * @param istDate - Date in IST timezone
   * @returns UTC Date object
   */
  static istToUtc(istDate: Date): Date {
    return dateFnsTz.fromZonedTime(istDate, IST_TIMEZONE)
  }

  /**
   * Convert UTC date to IST for display
   * @param utcDate - UTC Date object
   * @returns IST Date object
   */
  static utcToIst(utcDate: Date): Date {
    return dateFnsTz.toZonedTime(utcDate, IST_TIMEZONE)
  }

  /**
   * Get current IST time
   * @returns Current date in IST timezone
   */
  static getCurrentIST(): Date {
    return dateFnsTz.toZonedTime(new Date(), IST_TIMEZONE)
  }

  /**
   * Get current UTC time
   * @returns Current UTC date
   */
  static getCurrentUTC(): Date {
    return new Date()
  }

  /**
   * Format IST date for display
   * @param date - Date to format
   * @param formatString - Format pattern (default: 'dd MMM yyyy, hh:mm a')
   * @returns Formatted date string
   */
  static formatIST(date: Date, formatString = "dd MMM yyyy, hh:mm a"): string {
    const istDate = this.utcToIst(date)
    return format(istDate, formatString)
  }

  /**
   * Parse IST date string and convert to UTC
   * @param dateString - Date string in IST
   * @returns UTC Date object
   */
  static parseISTToUTC(dateString: string): Date {
    const istDate = parseISO(dateString)
    return this.istToUtc(istDate)
  }

  /**
   * Get current IST time as formatted string
   * @returns Current IST time as string
   */
  static getCurrentISTString(): string {
    return this.formatIST(new Date())
  }

  /**
   * Check if a UTC date is in the past
   * @param utcDate - UTC date to check
   * @returns true if date is in the past
   */
  static isInPast(utcDate: Date): boolean {
    const currentUTC = new Date()
    return utcDate.getTime() <= currentUTC.getTime()
  }

  /**
   * Add minutes to IST date and return UTC
   * @param istDate - IST date
   * @param minutes - Minutes to add
   * @returns UTC date with added minutes
   */
  static addMinutesToIST(istDate: Date, minutes: number): Date {
    const newISTDate = addMinutes(istDate, minutes)
    return this.istToUtc(newISTDate)
  }

  /**
   * Get minimum schedulable time (current time + 5 minutes in IST)
   * @returns Minimum schedulable time in IST
   */
  static getMinScheduleTime(): Date {
    const currentIST = this.getCurrentIST()
    return addMinutes(currentIST, 5)
  }

  /**
   * Validate if scheduled time is valid (at least 5 minutes from now)
   * @param istDate - IST date to validate
   * @returns true if valid, false otherwise
   */
  static isValidScheduleTime(istDate: Date): boolean {
    const minTime = this.getMinScheduleTime()
    return istDate.getTime() >= minTime.getTime()
  }
}
