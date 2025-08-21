/**
 * Auto-focus and responsive styles for Razorpay
 * This script automatically applies responsive styles and focus management to Razorpay modals
 */

(function() {
  'use strict';

  // Function to apply Razorpay responsive styles
  function applyRazorpayStyles() {
    const razorpayContainers = document.querySelectorAll('[class*="razorpay"], [id*="razorpay"], iframe[src*="razorpay"]');
    
    razorpayContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        // Apply responsive container styles
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '10000';
        container.style.background = 'rgba(0, 0, 0, 0.5)';
        
        // If it's an iframe, make it full screen
        if (container.tagName === 'IFRAME') {
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.maxWidth = '100vw';
          container.style.maxHeight = '100vh';
          container.style.border = 'none';
          container.style.borderRadius = '0';
        }
      }
    });

    // Also apply styles to parent containers
    const parentContainers = document.querySelectorAll('[class*="modal"], [class*="dialog"], [role="dialog"]');
    parentContainers.forEach((container) => {
      if (container instanceof HTMLElement) {
        // Check if this container contains Razorpay
        const hasRazorpay = container.querySelector('iframe[src*="razorpay"]');
        if (hasRazorpay) {
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.right = '0';
          container.style.bottom = '0';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.margin = '0';
          container.style.padding = '0';
          container.style.zIndex = '10000';
        }
      }
    });
  }

  // Function to handle Razorpay focus
  function handleRazorpayFocus() {
    // Remove focus from parent elements
    const modalElements = document.querySelectorAll('[role="dialog"] button, [role="dialog"] input, [data-radix-dialog-content] button, [data-radix-dialog-content] input, .modal button, .modal input');
    modalElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.blur();
      }
    });

    // Also blur any focused elements in the document
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Focus on Razorpay iframe
    setTimeout(() => {
      const razorpayIframe = document.querySelector('iframe[src*="razorpay"]');
      if (razorpayIframe) {
        try {
          // First focus the iframe itself
          razorpayIframe.focus();
          
          // Then try to focus on input elements inside the iframe
          const iframeDoc = razorpayIframe.contentDocument || razorpayIframe.contentWindow?.document;
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
            ];
            
            for (const selector of focusableSelectors) {
              const element = iframeDoc.querySelector(selector);
              if (element && element.offsetParent !== null) { // Check if element is visible
                element.focus();
                console.log('Focused on:', selector);
                break;
              }
            }
          }
        } catch (error) {
          console.log('Could not focus Razorpay iframe:', error);
        }
      }
    }, 200);
  }

  // Function to handle both styles and focus
  function handleRazorpay() {
    applyRazorpayStyles();
    handleRazorpayFocus();
  }

  // Observer to watch for Razorpay iframe creation
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node;
          
          // Check if this is a Razorpay iframe
          if (element.tagName === 'IFRAME' && element.getAttribute('src')?.includes('razorpay')) {
            console.log('Razorpay iframe detected, applying styles and focus');
            handleRazorpay();
          }
          
          // Check if this element contains Razorpay iframe
          const razorpayIframe = element.querySelector('iframe[src*="razorpay"]');
          if (razorpayIframe) {
            console.log('Razorpay iframe found in container, applying styles and focus');
            handleRazorpay();
          }
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also apply styles on window load
  window.addEventListener('load', () => {
    setTimeout(() => {
      handleRazorpay();
    }, 1000);
  });

  // Apply styles when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        handleRazorpay();
      }, 500);
    });
  } else {
    setTimeout(() => {
      handleRazorpay();
    }, 500);
  }

  // Make functions available globally for manual use
  window.razorpayAutoFocus = {
    applyStyles: applyRazorpayStyles,
    handleFocus: handleRazorpayFocus,
    handleAll: handleRazorpay
  };

  console.log('Razorpay auto-focus script loaded');
})();
