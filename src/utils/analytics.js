// src/utils/analytics.js

/**
 * Utility functions for Google Analytics tracking
 */

/**
 * Verifies that Google Analytics is loaded correctly
 */
const verifyGoogleAnalytics = () => {
  if (process.env.NODE_ENV === 'development') {
    if (typeof window.gtag !== 'function') {
      console.warn('Google Analytics (gtag) is not available. Events will not be tracked.');
      
      // Optional: Provide a mock implementation for development
      window.gtag = function(...args) {
        console.log('GA Event (mock):', ...args);
      };
    } else {
      console.log('Google Analytics is properly loaded and available.');
      
      // Send a test event in development
      window.gtag('event', 'ga_verification', {
        'event_category': 'System',
        'event_label': 'GA Verification',
        'non_interaction': true
      });
    }
  }
};

/**
 * Initialize and verify Google Analytics
 */
export const initializeAnalytics = () => {
  // Wait a short time to ensure GA has loaded
  setTimeout(() => {
    verifyGoogleAnalytics();
  }, 1000);
};

/**
 * Enable or disable debug mode for Google Analytics
 * @param {boolean} enable - Whether to enable debug mode
 */
export const debugGoogleAnalytics = (enable = true) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Don't do anything if gtag isn't a function
  if (typeof window.gtag !== 'function') {
    console.warn('Google Analytics not available for debugging');
    return;
  }
  
  // Check if we've already set up debugging
  if (enable && !window._originalGtag) {
    // Store the original gtag function
    window._originalGtag = window.gtag;
    
    // Replace with debugging version - FIXED to avoid recursion
    window.gtag = function(...args) {
      console.log('GA Event:', ...args);
      // Call the original function, not this wrapper
      if (window._originalGtag) {
        window._originalGtag.apply(window, args);
      }
    };
    
    console.log('Google Analytics debug mode enabled');
  } else if (!enable && window._originalGtag) {
    // Restore original gtag function
    window.gtag = window._originalGtag;
    window._originalGtag = null;
    console.log('Google Analytics debug mode disabled');
  }
};

/**
 * Track a user viewing company details
 * @param {Object} company - The company object being viewed
 */
export const trackCompanyView = (company) => {
  if (!window.gtag) {
    console.warn('Google Analytics not available');
    return;
  }
  
  window.gtag('event', 'view_company_details', {
    'event_category': 'Company Interaction',
    'event_label': company.name,
    'company_ticker': company.ticker,
    'company_focus': company.focus || 'Unknown',
    'exchange': company.exchange || 'Unknown'
  });
};

/**
 * Track company financial data being loaded
 * @param {string} ticker - Company ticker symbol
 * @param {string} name - Company name
 */
export const trackFinancialDataLoaded = (ticker, name) => {
  if (!window.gtag) {
    console.warn('Google Analytics not available');
    return;
  }
  
  window.gtag('event', 'financial_data_loaded', {
    'event_category': 'Data Interaction',
    'event_label': name || ticker,
    'company_ticker': ticker
  });
};

/**
 * Track user filtering by category
 * @param {string} category - Selected category
 */
export const trackCategoryFilter = (category) => {
  if (!window.gtag) return;
  
  window.gtag('event', 'filter_by_category', {
    'event_category': 'Filter Usage',
    'event_label': category
  });
};

/**
 * Track user filtering by country
 * @param {string} country - Selected country
 */
export const trackCountryFilter = (country) => {
  if (!window.gtag) return;
  
  window.gtag('event', 'filter_by_country', {
    'event_category': 'Filter Usage',
    'event_label': country
  });
};

/**
 * Track notification subscription
 * @param {string} email - User's email address
 */
export const trackNotificationSubscription = (email) => {
  if (!window.gtag) return;
  
  // Only pass a hashed version of the email for privacy
  const hashedEmail = email.split('@')[1] || 'unknown';
  
  window.gtag('event', 'notification_subscribe', {
    'event_category': 'User Engagement',
    'event_label': `Domain: ${hashedEmail}`,
    'non_interaction': false
  });
};