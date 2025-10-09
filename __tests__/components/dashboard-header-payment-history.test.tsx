/**
 * Unit/Integration tests for Dashboard Header - Payment History Link
 * Tests the Payment History link presence, accessibility, and navigation
 */

import { render, screen } from '@testing-library/react';
import DashboardHeader from '@/components/dashboard-header';

// Mock Next.js router and image
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Clerk UserButton
jest.mock('@clerk/nextjs', () => ({
  UserButton: () => <div data-testid="user-button">User Button</div>,
}));

// Mock GuestMobileSidebar
jest.mock('@/components/guest-mobile-sidebar', () => ({
  GuestMobileSidebar: () => <div data-testid="mobile-sidebar">Mobile Sidebar</div>,
}));

// Mock UsageProgress
jest.mock('@/components/usage-progress', () => ({
  UsageProgress: ({ initialUsedGenerations, initialAvailableGenerations }: any) => (
    <div data-testid="usage-progress">
      Usage: {initialUsedGenerations}/{initialAvailableGenerations}
    </div>
  ),
}));

describe('Dashboard Header - Payment History Link', () => {
  const defaultProps = {
    initialUsedGenerations: 5,
    initialAvailableGenerations: 100,
  };

  beforeEach(() => {
    render(<DashboardHeader {...defaultProps} />);
  });

  describe('Link Presence', () => {
    it('should render the Payment History link', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink).toBeInTheDocument();
    });

    it('should display Payment History text', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink).toHaveTextContent('Payment History');
    });

    it('should render all navigation links including Payment History', () => {
      // Home link is separate and doesn't have aria-label
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toBeInTheDocument();

      // Other links have aria-labels
      const expectedLinks = [
        'Our Story',
        'Pricing',
        'FAQ',
        'Contact',
        'Payment History',
      ];

      expectedLinks.forEach((linkText) => {
        const link = screen.getByRole('link', { name: `Navigate to ${linkText}` });
        expect(link).toBeInTheDocument();
      });
    });
  });

  describe('Link Navigation', () => {
    it('should have correct href to payment history page', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink).toHaveAttribute('href', '/dashboard/billing/payment-history');
    });

    it('should be a valid Next.js Link component', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink.tagName).toBe('A');
    });
  });

  describe('Link Placement', () => {
    it('should be placed after Contact link', () => {
      const allLinks = screen.getAllByRole('link').filter((link) =>
        link.getAttribute('aria-label')?.includes('Navigate to')
      );

      const contactIndex = allLinks.findIndex(
        (link) => link.textContent === 'Contact'
      );
      const paymentHistoryIndex = allLinks.findIndex(
        (link) => link.textContent === 'Payment History'
      );

      expect(paymentHistoryIndex).toBeGreaterThan(contactIndex);
    });

    it('should be within the navigation container', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      const navContainer = paymentHistoryLink.closest('.nav-container-light-green');
      expect(navContainer).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink).toHaveAttribute(
        'aria-label',
        'Navigate to Payment History'
      );
    });

    it('should be keyboard accessible', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      // Link should not have tabindex -1 (should be focusable)
      expect(paymentHistoryLink).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have nav-link class for consistent styling', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink).toHaveClass('nav-link');
    });

    it('should be accessible by keyboard users', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      
      // Check that link is focusable (has href and no tabindex=-1)
      expect(paymentHistoryLink).toHaveAttribute('href');
      expect(paymentHistoryLink.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  describe('Conditional Rendering - Authenticated Users', () => {
    it('should render for authenticated users in dashboard', () => {
      // Since DashboardHeader is only used in authenticated dashboard routes,
      // if the component renders, the user is authenticated
      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      expect(paymentHistoryLink).toBeInTheDocument();
    });

    it('should display user-related components alongside Payment History link', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      const usageProgress = screen.getByTestId('usage-progress');
      const userButton = screen.getByTestId('user-button');

      expect(paymentHistoryLink).toBeInTheDocument();
      expect(usageProgress).toBeInTheDocument();
      expect(userButton).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('should have consistent styling with other nav links', () => {
      const navLinks = screen.getAllByRole('link').filter((link) =>
        link.classList.contains('nav-link')
      );

      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });

      // All nav links should have the same class
      navLinks.forEach((link) => {
        expect(link).toHaveClass('nav-link');
      });

      expect(paymentHistoryLink).toHaveClass('nav-link');
    });
  });

  describe('Hover and Focus States', () => {
    it('should have focus state styles applied through nav-link class', () => {
      const paymentHistoryLink = screen.getByRole('link', {
        name: 'Navigate to Payment History',
      });
      
      // The nav-link class provides hover/focus styles
      expect(paymentHistoryLink).toHaveClass('nav-link');
    });
  });
});

describe('Dashboard Header - Payment History Link - Different Usage States', () => {
  it('should render Payment History link with zero generations used', () => {
    render(
      <DashboardHeader
        initialUsedGenerations={0}
        initialAvailableGenerations={100}
      />
    );

    const paymentHistoryLink = screen.getByRole('link', {
      name: 'Navigate to Payment History',
    });
    expect(paymentHistoryLink).toBeInTheDocument();
  });

  it('should render Payment History link with all generations used', () => {
    render(
      <DashboardHeader
        initialUsedGenerations={100}
        initialAvailableGenerations={100}
      />
    );

    const paymentHistoryLink = screen.getByRole('link', {
      name: 'Navigate to Payment History',
    });
    expect(paymentHistoryLink).toBeInTheDocument();
  });

  it('should render Payment History link with premium account', () => {
    render(
      <DashboardHeader
        initialUsedGenerations={500}
        initialAvailableGenerations={10000}
      />
    );

    const paymentHistoryLink = screen.getByRole('link', {
      name: 'Navigate to Payment History',
    });
    expect(paymentHistoryLink).toBeInTheDocument();
  });
});

