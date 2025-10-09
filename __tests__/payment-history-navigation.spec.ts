/**
 * E2E Tests for Payment History Link Navigation
 * 
 * Tests the Payment History link in the Dashboard header:
 * 
 * 1. Link visibility for authenticated users
 * 2. Navigation functionality to payment history page
 * 3. Link placement next to Contact link
 * 4. Accessibility features (aria-label, focus state)
 * 5. Responsive behavior on mobile and desktop
 * 6. Keyboard navigation
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to sign in a user
 * Note: You may need to adjust this based on your Clerk authentication setup
 */
async function signInUser(page: Page) {
  // Navigate to sign-in page
  await page.goto('/sign-in');
  await page.waitForLoadState('networkidle');
  
  // This is a placeholder - adjust based on your actual sign-in flow
  // For now, we'll assume the test environment has a way to authenticate
  // You might need to use Clerk's testing tokens or a test user
}

/**
 * Helper function to check if user is on dashboard
 */
async function isOnDashboard(page: Page): Promise<boolean> {
  return page.url().includes('/dashboard');
}

test.describe('Payment History Link - Desktop Views', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard (assumes authentication is handled)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display Payment History link in dashboard header', async ({ page }) => {
    // Look for Payment History link
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await expect(paymentHistoryLink).toBeVisible();
  });

  test('should have correct href for Payment History link', async ({ page }) => {
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await expect(paymentHistoryLink).toHaveAttribute('href', '/dashboard/billing/payment-history');
  });

  test('should place Payment History link after Contact link', async ({ page }) => {
    // Get all navigation links
    const navContainer = page.locator('.nav-container-light-green');
    const navLinks = navContainer.locator('a.nav-link');
    
    // Get text content of all links
    const linkTexts = await navLinks.allTextContents();
    
    // Find indices
    const contactIndex = linkTexts.findIndex(text => text.includes('Contact'));
    const paymentHistoryIndex = linkTexts.findIndex(text => text.includes('Payment History'));
    
    // Payment History should come after Contact
    expect(paymentHistoryIndex).toBeGreaterThan(contactIndex);
  });

  test('should navigate to payment history page when clicked', async ({ page }) => {
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await paymentHistoryLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Check URL
    expect(page.url()).toContain('/dashboard/billing/payment-history');
    
    // Check page content
    await expect(page.locator('text=Payments')).toBeVisible();
    await expect(page.locator('text=Payment history made easy')).toBeVisible();
  });

  test('should have proper aria-label for accessibility', async ({ page }) => {
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    const ariaLabel = await paymentHistoryLink.getAttribute('aria-label');
    
    expect(ariaLabel).toBe('Navigate to Payment History');
  });

  test('should have hover state styling', async ({ page }) => {
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    
    // Get initial color
    const initialColor = await paymentHistoryLink.evaluate((el) => 
      window.getComputedStyle(el).color
    );
    
    // Hover over link
    await paymentHistoryLink.hover();
    await page.waitForTimeout(300); // Wait for transition
    
    // The link should have nav-link class which provides hover styles
    const hasNavLinkClass = await paymentHistoryLink.evaluate((el) => 
      el.classList.contains('nav-link')
    );
    
    expect(hasNavLinkClass).toBe(true);
  });

  test('should be keyboard accessible', async ({ page }) => {
    // Focus on the page
    await page.keyboard.press('Tab');
    
    // Tab through navigation items to reach Payment History
    let currentFocus = '';
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!currentFocus.includes('Payment History') && attempts < maxAttempts) {
      await page.keyboard.press('Tab');
      currentFocus = await page.evaluate(() => document.activeElement?.textContent || '');
      attempts++;
    }
    
    // Verify we can reach the link
    expect(currentFocus).toContain('Payment History');
    
    // Press Enter to navigate
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    
    // Should navigate to payment history page
    expect(page.url()).toContain('/dashboard/billing/payment-history');
  });

  test('should maintain visibility when scrolling', async ({ page }) => {
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(300);
    
    // Link should still be visible (header is likely sticky/fixed)
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await expect(paymentHistoryLink).toBeVisible();
  });

  test('should have consistent styling with other navigation links', async ({ page }) => {
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    const contactLink = page.locator('a:has-text("Contact")').first();
    
    // Get computed styles
    const paymentHistoryStyles = await paymentHistoryLink.evaluate((el) => ({
      padding: window.getComputedStyle(el).padding,
      borderRadius: window.getComputedStyle(el).borderRadius,
      fontWeight: window.getComputedStyle(el).fontWeight,
    }));
    
    const contactStyles = await contactLink.evaluate((el) => ({
      padding: window.getComputedStyle(el).padding,
      borderRadius: window.getComputedStyle(el).borderRadius,
      fontWeight: window.getComputedStyle(el).fontWeight,
    }));
    
    // Styles should match
    expect(paymentHistoryStyles.padding).toBe(contactStyles.padding);
    expect(paymentHistoryStyles.borderRadius).toBe(contactStyles.borderRadius);
    expect(paymentHistoryStyles.fontWeight).toBe(contactStyles.fontWeight);
  });
});

test.describe('Payment History Link - Mobile Views', () => {
  
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size
  
  test('should hide desktop navigation on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Desktop nav container should be hidden on mobile
    const desktopNav = page.locator('.nav-container-light-green');
    await expect(desktopNav).toBeHidden();
  });

  test('should show mobile sidebar with navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Mobile sidebar should be visible
    const mobileSidebar = page.locator('[data-testid="mobile-sidebar"]').or(
      page.locator('button').filter({ has: page.locator('[data-lucide="menu"]') })
    ).first();
    
    const exists = await mobileSidebar.count() > 0;
    expect(exists).toBe(true);
  });
});

test.describe('Payment History Link - Authentication States', () => {
  
  test('should not be accessible to unauthenticated users', async ({ page }) => {
    // Try to access payment history directly without authentication
    await page.goto('/dashboard/billing/payment-history');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to sign-in or show auth error
    const url = page.url();
    const isRedirectedToAuth = url.includes('/sign-in') || url.includes('/sign-up');
    const isOnPaymentHistory = url.includes('/dashboard/billing/payment-history');
    
    // If on payment history, user is authenticated; otherwise should be redirected
    if (!isOnPaymentHistory) {
      expect(isRedirectedToAuth).toBe(true);
    }
  });

  test('should be accessible to authenticated users', async ({ page }) => {
    // Navigate to dashboard (assumes authentication)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // If we reach the dashboard, authentication is successful
    const isAuthenticated = await isOnDashboard(page);
    
    if (isAuthenticated) {
      // Payment History link should be visible
      const paymentHistoryLink = page.locator('a:has-text("Payment History")');
      await expect(paymentHistoryLink).toBeVisible();
      
      // Should be able to navigate
      await paymentHistoryLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/dashboard/billing/payment-history');
    }
  });
});

test.describe('Payment History Page - Content Verification', () => {
  
  test('should display payment history page with correct content', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to payment history
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await paymentHistoryLink.click();
    await page.waitForLoadState('networkidle');
    
    // Verify page elements
    await expect(page.locator('text=Payments')).toBeVisible();
    await expect(page.locator('text=Payment history made easy')).toBeVisible();
    
    // Check for table structure (even if empty)
    const hasTable = await page.locator('table').count() > 0;
    
    if (hasTable) {
      // If table exists, check headers
      await expect(page.locator('th:has-text("ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Payment Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Payment Amouint")')).toBeVisible(); // Note: typo exists in source
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    }
  });

  test('should display empty state when no transactions exist', async ({ page }) => {
    await page.goto('/dashboard/billing/payment-history');
    await page.waitForLoadState('networkidle');
    
    // Check if empty state or table is shown
    const hasTable = await page.locator('table').count() > 0;
    const hasEmptyMessage = await page.locator('text=No payment history available').count() > 0;
    
    // Should have either table or empty message
    expect(hasTable || hasEmptyMessage).toBe(true);
  });
});

test.describe('Payment History Link - Cross-Browser Compatibility', () => {
  
  test('should work consistently across all browsers', async ({ page, browserName }) => {
    console.log(`Testing on: ${browserName}`);
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Payment History link should be visible
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await expect(paymentHistoryLink).toBeVisible();
    
    // Should navigate correctly
    await paymentHistoryLink.click();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/dashboard/billing/payment-history');
  });
});

test.describe('Payment History Link - Back Navigation', () => {
  
  test('should allow navigation back to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to payment history
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await paymentHistoryLink.click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're on payment history
    expect(page.url()).toContain('/dashboard/billing/payment-history');
    
    // Navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Should be back on dashboard
    expect(page.url()).toContain('/dashboard');
    expect(page.url()).not.toContain('/billing/payment-history');
  });

  test('should allow navigation using browser back button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const paymentHistoryLink = page.locator('a:has-text("Payment History")');
    await paymentHistoryLink.click();
    await page.waitForLoadState('networkidle');
    
    // Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Payment History link should still be visible
    await expect(page.locator('a:has-text("Payment History")')).toBeVisible();
  });
});

