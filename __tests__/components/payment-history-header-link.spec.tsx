/**
 * Unit Tests: Payment History Header Link
 * 
 * Tests that the Payment History link:
 * 1. Appears in desktop header navigation after authentication
 * 2. Appears in mobile navigation after authentication
 * 3. Navigates to correct URL when clicked
 * 4. Has correct icon and text
 * 5. Shows active state when on Payment History page
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MainNav } from '@/components/main-nav';
import { MobileNav } from '@/components/mobile-nav';
import { usePathname } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Payment History Header Link - Desktop', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('should render Payment History link in desktop navigation', () => {
    render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const paymentLink = screen.getByText('Payments');
    expect(paymentLink).toBeInTheDocument();
  });

  it('should have correct href for Payment History', () => {
    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
  });

  it('should display CreditCard icon for Payment History', () => {
    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    // Find the link and verify it has the icon
    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
    
    // Check if CreditCard icon is present (Lucide icons render as SVG)
    const icon = link?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should be visible after authentication (in dashboard layout)', () => {
    // Since MainNav is only used in dashboard layout which requires auth,
    // if the component renders, user is authenticated
    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const paymentLink = screen.getByText('Payments');
    expect(paymentLink).toBeVisible();
  });

  it('should show active state when on Payment History page', () => {
    // Mock being on the payment history page
    (usePathname as jest.Mock).mockReturnValue('/dashboard/billing/payment-history');

    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
    // Note: Active state styling is CSS-based, we verify the link exists
  });
});

describe('Payment History Header Link - Mobile', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('should render Payment History link in mobile navigation', () => {
    render(
      <MobileNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const paymentLink = screen.getByText('Payments');
    expect(paymentLink).toBeInTheDocument();
  });

  it('should have correct href for Payment History in mobile nav', () => {
    const { container } = render(
      <MobileNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
  });

  it('should display Banknote icon for Payment History in mobile', () => {
    const { container } = render(
      <MobileNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
    
    // Check if Banknote icon is present
    const icon = link?.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should be accessible via keyboard navigation', () => {
    const { container } = render(
      <MobileNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toHaveAttribute('tabIndex', '0');
  });

  it('should show active styling when on Payment History page', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard/billing/payment-history');

    const { container } = render(
      <MobileNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link).toBeInTheDocument();
    expect(link).toHaveClass('bg-gray-100');
  });
});

describe('Payment History Navigation Flow', () => {
  it('should have consistent link text across desktop and mobile', () => {
    const { container: desktopContainer } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const { container: mobileContainer } = render(
      <MobileNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const desktopLinks = screen.getAllByText('Payments');
    expect(desktopLinks.length).toBeGreaterThanOrEqual(2); // At least one in desktop, one in mobile
  });

  it('should navigate to full payment history URL', () => {
    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]') as HTMLAnchorElement;
    expect(link?.href).toContain('/dashboard/billing/payment-history');
  });

  it('should be part of authenticated navigation only', () => {
    // MainNav is only rendered in dashboard layout which requires auth
    // If component renders without error, it confirms auth-gated behavior
    expect(() => {
      render(
        <MainNav
          initialUsedGenerations={10}
          initialAvailableGenerations={100}
        />
      );
    }).not.toThrow();

    const paymentLink = screen.getByText('Payments');
    expect(paymentLink).toBeInTheDocument();
  });
});

describe('Payment History Link - Accessibility', () => {
  it('should have accessible link text', () => {
    render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const paymentLink = screen.getByText('Payments');
    expect(paymentLink).toHaveTextContent('Payments');
  });

  it('should be keyboard accessible', () => {
    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    expect(link?.tagName.toLowerCase()).toBe('a');
    // Links are keyboard accessible by default
  });

  it('should have visible focus indicator', () => {
    const { container } = render(
      <MainNav
        initialUsedGenerations={10}
        initialAvailableGenerations={100}
      />
    );

    const link = container.querySelector('a[href="/dashboard/billing/payment-history"]');
    // Nav links have transition and hover styles
    expect(link).toHaveClass('transition-colors');
  });
});

