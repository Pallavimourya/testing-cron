/**
 * Utility functions for managing Razorpay modal focus
 */

/**
 * Applies responsive styles to Razorpay containers
 */
export const applyRazorpayResponsiveStyles = () => {
  // Find Razorpay containers and apply responsive styles
  const razorpayContainers = document.querySelectorAll('[class*="razorpay"], [id*="razorpay"], iframe[src*="razorpay"]')
  
  razorpayContainers.forEach((container) => {
    if (container instanceof HTMLElement) {
      // Apply responsive container styles
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.zIndex = '10000'
      container.style.background = 'rgba(0, 0, 0, 0.5)'
      
      // If it's an iframe, make it full screen
      if (container.tagName === 'IFRAME') {
        container.style.width = '100vw'
        container.style.height = '100vh'
        container.style.maxWidth = '100vw'
        container.style.maxHeight = '100vh'
        container.style.border = 'none'
        container.style.borderRadius = '0'
      }
    }
  })
  
  // Also apply styles to parent containers
  const parentContainers = document.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]')
  parentContainers.forEach((container) => {
    if (container instanceof HTMLElement) {
      // Check if this container contains Razorpay
      const hasRazorpay = container.querySelector('iframe[src*="razorpay"]')
      if (hasRazorpay) {
        container.style.position = 'fixed'
        container.style.top = '0'
        container.style.left = '0'
        container.style.right = '0'
        container.style.bottom = '0'
        container.style.width = '100%'
        container.style.height = '100%'
        container.style.margin = '0'
        container.style.padding = '0'
        container.style.zIndex = '10000'
      }
    }
  })
}

/**
 * Handles focus management when Razorpay modal opens
 * Removes focus from parent modal elements and focuses on Razorpay iframe
 */
export const handleRazorpayFocus = () => {
  // Apply responsive styles first
  applyRazorpayResponsiveStyles()
  
  // Remove focus from our modal elements
  const modalElements = document.querySelectorAll('[role="dialog"] button, [role="dialog"] input, [data-radix-dialog-content] button, [data-radix-dialog-content] input, .modal button, .modal input')
  modalElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      element.blur()
    }
  })
  
  // Also blur any focused elements in the document
  if (document.activeElement && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
  
  // Focus on the first focusable element in Razorpay iframe
  setTimeout(() => {
    const razorpayIframe = document.querySelector('iframe[src*="razorpay"]') as HTMLIFrameElement
    if (razorpayIframe) {
      try {
        // First focus the iframe itself
        razorpayIframe.focus()
        
        // Then try to focus on input elements inside the iframe
        const iframeDoc = razorpayIframe.contentDocument || razorpayIframe.contentWindow?.document
        if (iframeDoc) {
          // Try multiple selectors to find focusable elements
          const focusableSelectors = [
            'input[type="text"]',
            'input[type="email"]',
            'input[type="tel"]',
            'input[type="number"]',
            'input:not([type="hidden"])',
            'button',
            'select',
            'textarea',
            '[tabindex]:not([tabindex="-1"])'
          ]
          
          for (const selector of focusableSelectors) {
            const element = iframeDoc.querySelector(selector) as HTMLElement
            if (element && element.offsetParent !== null) { // Check if element is visible
              element.focus()
              console.log(`Focused on: ${selector}`)
              break
            }
          }
        }
      } catch (error) {
        console.log("Could not focus Razorpay iframe directly:", error)
      }
    }
  }, 150) // Increased delay to ensure iframe is fully loaded
}

/**
 * Sets up focus management for Razorpay modal
 * Returns cleanup function to clear intervals
 */
export const setupRazorpayFocus = () => {
  let cleanupFunctions: (() => void)[] = []
  
  // Handle focus after Razorpay opens
  const initialTimeout = setTimeout(() => {
    handleRazorpayFocus()
  }, 300) // Increased delay
  
  cleanupFunctions.push(() => clearTimeout(initialTimeout))
  
  // Also listen for iframe load events
  const checkForIframe = setInterval(() => {
    const razorpayIframe = document.querySelector('iframe[src*="razorpay"]')
    if (razorpayIframe) {
      clearInterval(checkForIframe)
      handleRazorpayFocus()
    }
  }, 100)
  
  cleanupFunctions.push(() => clearInterval(checkForIframe))
  
  // Clear interval after 10 seconds to prevent infinite checking
  const cleanupTimeout = setTimeout(() => {
    clearInterval(checkForIframe)
  }, 10000)
  
  cleanupFunctions.push(() => clearTimeout(cleanupTimeout))
  
  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}

/**
 * Opens Razorpay with proper focus management
 */
export const openRazorpayWithFocus = (razorpayInstance: any) => {
  try {
    // Close any existing modals first
    const existingModals = document.querySelectorAll('[role="dialog"]')
    existingModals.forEach(modal => {
      if (modal instanceof HTMLElement) {
        modal.style.display = 'none'
      }
    })
    
    // Open Razorpay
    razorpayInstance.open()
    
    // Setup focus management
    const cleanup = setupRazorpayFocus()
    
    // Store cleanup function for later use
    ;(window as any).razorpayFocusCleanup = cleanup
    
  } catch (error) {
    console.error("Razorpay open error:", error)
    throw error
  }
}

/**
 * Force focus on Razorpay iframe (can be called manually if needed)
 */
export const forceRazorpayFocus = () => {
  handleRazorpayFocus()
}

/**
 * Cleanup function to be called when Razorpay is closed
 */
export const cleanupRazorpayFocus = () => {
  if ((window as any).razorpayFocusCleanup) {
    ;(window as any).razorpayFocusCleanup()
    delete (window as any).razorpayFocusCleanup
  }
}
