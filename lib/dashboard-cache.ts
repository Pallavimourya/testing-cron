/**
 * Utility functions for managing dashboard cache
 */

export async function clearDashboardCache() {
  try {
    const response = await fetch('/api/dashboard-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error('Failed to clear dashboard cache')
    }
  } catch (error) {
    console.error('Error clearing dashboard cache:', error)
  }
}

/**
 * Clear cache and reload dashboard data
 */
export async function refreshDashboardData() {
  await clearDashboardCache()
  
  // Trigger a page reload or refetch data
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

