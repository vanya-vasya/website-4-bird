/**
 * Analytics and Event Tracking Utility
 * 
 * Provides functions to track user interactions and events using Google Analytics
 * GA ID: G-DYY23NK5V1 (configured in app/layout.tsx)
 */

// Check if Google Analytics is available
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Track a custom event in Google Analytics
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
    
    // Also log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, eventParams);
    }
  }
};

/**
 * Track page view
 */
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Page View:', pagePath, pageTitle);
    }
  }
};

/**
 * Track Payment History specific events
 */
export const PaymentHistoryAnalytics = {
  /**
   * Track when user views Payment History page
   */
  viewPaymentHistory: (transactionCount: number = 0) => {
    trackEvent('view_payment_history', {
      event_category: 'Payment',
      event_label: 'Payment History Page View',
      transaction_count: transactionCount,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track when user clicks Payment History link in navigation
   */
  clickPaymentHistoryLink: (location: 'desktop_nav' | 'mobile_nav' | 'dashboard_header') => {
    trackEvent('click_payment_history_link', {
      event_category: 'Navigation',
      event_label: `Payment History Link - ${location}`,
      link_location: location,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track when user views a specific transaction
   */
  viewTransaction: (transactionId: string, amount: number, currency: string) => {
    trackEvent('view_transaction_details', {
      event_category: 'Payment',
      event_label: 'Transaction Details View',
      transaction_id: transactionId,
      amount: amount,
      currency: currency,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track when Payment History data is loaded
   */
  loadPaymentHistory: (success: boolean, transactionCount: number = 0, error?: string) => {
    trackEvent('load_payment_history_data', {
      event_category: 'Data',
      event_label: success ? 'Payment History Load Success' : 'Payment History Load Failed',
      success: success,
      transaction_count: transactionCount,
      error: error,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Track general navigation events
 */
export const NavigationAnalytics = {
  /**
   * Track navigation link click
   */
  clickNavLink: (linkName: string, location: string, destination: string) => {
    trackEvent('navigation_click', {
      event_category: 'Navigation',
      event_label: `${linkName} - ${location}`,
      link_name: linkName,
      link_location: location,
      destination: destination,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Track payment-related events
 */
export const PaymentAnalytics = {
  /**
   * Track when user initiates payment
   */
  initiatePayment: (amount: number, currency: string, tokens: number) => {
    trackEvent('initiate_payment', {
      event_category: 'Payment',
      event_label: 'Payment Initiated',
      amount: amount,
      currency: currency,
      tokens: tokens,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track successful payment
   */
  paymentSuccess: (transactionId: string, amount: number, currency: string, tokens: number) => {
    trackEvent('payment_success', {
      event_category: 'Payment',
      event_label: 'Payment Completed Successfully',
      transaction_id: transactionId,
      amount: amount,
      currency: currency,
      tokens: tokens,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track payment failure
   */
  paymentFailure: (amount: number, currency: string, error: string) => {
    trackEvent('payment_failure', {
      event_category: 'Payment',
      event_label: 'Payment Failed',
      amount: amount,
      currency: currency,
      error: error,
      timestamp: new Date().toISOString(),
    });
  },
};

export default {
  trackEvent,
  trackPageView,
  PaymentHistoryAnalytics,
  NavigationAnalytics,
  PaymentAnalytics,
};

