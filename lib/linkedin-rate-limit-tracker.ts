// LinkedIn Rate Limit Tracker
export class LinkedInRateLimitTracker {
  private static readonly RATE_LIMIT_KEY = 'linkedin_rate_limit_hit'
  private static readonly DAILY_RESET_HOURS = 24

  // Track when rate limit was hit
  static trackRateLimitHit() {
    const now = new Date()
    localStorage.setItem(this.RATE_LIMIT_KEY, now.toISOString())
  }

  // Check if rate limit is still active
  static isRateLimitActive(): boolean {
    const hitTime = localStorage.getItem(this.RATE_LIMIT_KEY)
    if (!hitTime) return false

    const hitDate = new Date(hitTime)
    const now = new Date()
    const hoursSinceHit = (now.getTime() - hitDate.getTime()) / (1000 * 60 * 60)

    return hoursSinceHit < this.DAILY_RESET_HOURS
  }

  // Get time until rate limit resets
  static getTimeUntilReset(): { hours: number; minutes: number } {
    const hitTime = localStorage.getItem(this.RATE_LIMIT_KEY)
    if (!hitTime) return { hours: 0, minutes: 0 }

    const hitDate = new Date(hitTime)
    const resetTime = new Date(hitDate.getTime() + this.DAILY_RESET_HOURS * 60 * 60 * 1000)
    const now = new Date()
    
    const timeLeft = resetTime.getTime() - now.getTime()
    if (timeLeft <= 0) return { hours: 0, minutes: 0 }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    return { hours, minutes }
  }

  // Get user-friendly message
  static getRateLimitMessage(): string {
    if (!this.isRateLimitActive()) {
      return "LinkedIn API is ready to connect!"
    }

    const { hours, minutes } = this.getTimeUntilReset()
    
    if (hours > 0) {
      return `LinkedIn API rate limit active. Try again in ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}.`
    } else {
      return `LinkedIn API rate limit active. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    }
  }

  // Clear rate limit tracking (when successful connection)
  static clearRateLimit() {
    localStorage.removeItem(this.RATE_LIMIT_KEY)
  }

  // Check if we should show rate limit warning
  static shouldShowWarning(): boolean {
    return this.isRateLimitActive()
  }
}
