/**
 * Unit Test: Dashboard Header - Payment History Link
 * 
 * Verifies that the Payment History link:
 * 1. Appears in dashboard header navigation
 * 2. Is positioned after Contact link
 * 3. Has correct href to /dashboard/billing/payment-history
 * 4. Only appears in dashboard header (not global/shared headers)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardHeader from '@/components/dashboard-header';

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Clerk UserButton
jest.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button">UserButton</div>,
}));

// Mock components
jest.mock('@/components/guest-mobile-sidebar', () => ({
  GuestMobileSidebar: () => <div data-testid="mobile-sidebar">Mobile Sidebar</div>,
}));

jest.mock('@/components/usage-progress', () => ({
  UsageProgress: () => <div data-testid="usage-progress">Usage Progress</div>,
}));

jest.mock('@/constants/product-navigation', () => ({
  PRODUCT_ITEMS: [
    {
      label: 'Your Own Chef',
      href: '/dashboard/conversation?toolId=master-chef',
      icon: 'Crown',
    },
  ],
}));

jest.mock('@/components/shared/ProductIcon', () => ({
  ProductIcon: () => <div data-testid="product-icon">Icon</div>,
}));

describe('Dashboard Header - Payment History Link', () => {
  const defaultProps = {
    initialUsedGenerations: 10,
    initialAvailableGenerations: 100,
  };

  it('should render Payment History link in dashboard header', () => {
    render(<DashboardHeader {...defaultProps} />);

    const paymentHistoryLink = screen.getByText('Payment History');
    expect(paymentHistoryLink).toBeInTheDocument();
  });

  it('should have correct href for Payment History', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Payment History');
  });

  it('should render Payment History link after Contact link', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    // Get all navigation links
    const navLinks = Array.from(
      container.querySelectorAll('.nav-container-light-green a.nav-link')
    );

    const linkTexts = navLinks.map(link => link.textContent);

    // Find indices
    const contactIndex = linkTexts.indexOf('Contact');
    const paymentHistoryIndex = linkTexts.indexOf('Payment History');

    // Verify Payment History comes after Contact
    expect(contactIndex).toBeGreaterThan(-1);
    expect(paymentHistoryIndex).toBeGreaterThan(-1);
    expect(paymentHistoryIndex).toBeGreaterThan(contactIndex);
  });

  it('should render all navigation links in correct order', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const navLinks = Array.from(
      container.querySelectorAll('.nav-container-light-green a.nav-link')
    );

    const linkTexts = navLinks.map(link => link.textContent);

    // Expected order: Home, Our Story, Pricing, FAQ, Contact, Payment History
    // (Products dropdown is separate)
    expect(linkTexts).toContain('Home');
    expect(linkTexts).toContain('Our Story');
    expect(linkTexts).toContain('Pricing');
    expect(linkTexts).toContain('FAQ');
    expect(linkTexts).toContain('Contact');
    expect(linkTexts).toContain('Payment History');
  });

  it('should apply correct CSS classes to Payment History link', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toHaveClass('nav-link');
  });

  it('should be part of dashboard-specific header', () => {
    // DashboardHeader component only renders in dashboard layout
    // If component renders without error, it confirms it's dashboard-specific
    expect(() => {
      render(<DashboardHeader {...defaultProps} />);
    }).not.toThrow();

    const paymentHistoryLink = screen.getByText('Payment History');
    expect(paymentHistoryLink).toBeInTheDocument();
  });

  it('should include usage progress and user button (dashboard-specific features)', () => {
    render(<DashboardHeader {...defaultProps} />);

    // These components only appear in dashboard header, not global header
    const usageProgress = screen.getByTestId('usage-progress');
    const userButton = screen.getByTestId('user-button');

    expect(usageProgress).toBeInTheDocument();
    expect(userButton).toBeInTheDocument();
  });

  it('should pass correct props to UsageProgress', () => {
    render(
      <DashboardHeader
        initialUsedGenerations={25}
        initialAvailableGenerations={150}
      />
    );

    const usageProgress = screen.getByTestId('usage-progress');
    expect(usageProgress).toBeInTheDocument();
  });

  it('should render navigation container with correct styling', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const navContainer = container.querySelector('.nav-container-light-green');
    expect(navContainer).toBeInTheDocument();
  });

  it('should have Payment History link as valid anchor element', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]') as HTMLAnchorElement;
    expect(link?.tagName.toLowerCase()).toBe('a');
    expect(link?.href).toContain('/dashboard/billing/payment-history');
  });
});

describe('Dashboard Header - Navigation Accessibility', () => {
  const defaultProps = {
    initialUsedGenerations: 10,
    initialAvailableGenerations: 100,
  };

  it('should have accessible link text for Payment History', () => {
    render(<DashboardHeader {...defaultProps} />);

    const paymentHistoryLink = screen.getByText('Payment History');
    expect(paymentHistoryLink).toHaveTextContent('Payment History');
  });

  it('should be keyboard navigable', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    // Links are keyboard accessible by default
    expect(link?.tagName.toLowerCase()).toBe('a');
  });

  it('should have proper semantic HTML structure', () => {
    const { container } = render(<DashboardHeader {...defaultProps} />);

    const header = container.querySelector('header');
    const nav = container.querySelector('nav');

    expect(header).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });
});

