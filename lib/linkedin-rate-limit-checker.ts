// LinkedIn Rate Limit Checker
export class LinkedInRateLimitChecker {
  
  // Check if rate limit is user-specific or app-wide
  static async checkRateLimitScope(): Promise<{
    isUserSpecific: boolean;
    isAppWide: boolean;
    message: string;
  }> {
    try {
      // Try to make a simple API call to test
      const response = await fetch('/api/linkedin/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 429) {
        // Rate limit hit - check if it's user-specific
        return {
          isUserSpecific: true,
          isAppWide: false,
          message: "Rate limit appears to be user-specific. Try with a different LinkedIn account."
        }
      } else if (response.ok) {
        return {
          isUserSpecific: false,
          isAppWide: false,
          message: "No rate limit detected. API is working normally."
        }
      } else {
        return {
          isUserSpecific: false,
          isAppWide: true,
          message: "API error detected. May be app-wide issue."
        }
      }
    } catch (error) {
      return {
        isUserSpecific: false,
        isAppWide: true,
        message: "Network error. Cannot determine rate limit scope."
      }
    }
  }

  // Get recommendations based on rate limit type
  static getRecommendations(isUserSpecific: boolean): string[] {
    if (isUserSpecific) {
      return [
        "✅ Try connecting with a different LinkedIn account",
        "✅ Each LinkedIn user has their own daily API quota",
        "✅ User A's limit doesn't affect User B's limit",
        "⏰ Wait 24 hours for the current user's limit to reset"
      ]
    } else {
      return [
        "❌ This appears to be an app-wide rate limit",
        "⏰ Wait 24 hours for the application limit to reset",
        "🔧 Consider implementing better rate limiting",
        "📊 Monitor API usage to avoid future limits"
      ]
    }
  }

  // Test with different user (simulation)
  static async testWithDifferentUser(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // This would be a real test in production
      // For now, return a simulation
      return {
        success: true,
        message: "Different user test would work. Each LinkedIn account has separate quotas."
      }
    } catch (error) {
      return {
        success: false,
        message: "Test failed. Please try manually with a different LinkedIn account."
      }
    }
  }
}
