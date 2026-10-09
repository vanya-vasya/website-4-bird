/**
 * Integration tests for Footer navigation links
 * Tests presence, order, and correct href targets for footer menu items
 */

import { render, screen } from '@testing-library/react';
import Footer from '@/components/landing/footer';

describe('Footer Navigation Integration Tests', () => {
  beforeEach(() => {
    render(<Footer />);
  });

  describe('Menu Links Presence', () => {
    it('should render all expected menu links', () => {
      const expectedMenuItems = [
        'Home',
        'Products', 
        'Our Story',
        'Pricing',
        'FAQ',
        'Contact'
      ];

      expectedMenuItems.forEach(item => {
        expect(screen.getByRole('link', { name: `Navigate to ${item} page` })).toBeInTheDocument();
      });
    });

    it('should render all important links with correct aria-labels', () => {
      const expectedImportantLinks = [
        'Privacy Policy',
        'Terms and Conditions',
        'Return Policy',
        'Cookies Policy'
      ];

      expectedImportantLinks.forEach(item => {
        expect(screen.getByRole('link', { name: `Read our ${item}` })).toBeInTheDocument();
      });
    });
  });

  describe('Menu Links Order and Targets', () => {
    it('should display menu links in correct order', () => {
      const menuSection = screen.getByText('Menu').closest('.footer-widget__column');
      expect(menuSection).toBeInTheDocument();

      const menuLinks = menuSection?.querySelectorAll('a');
      expect(menuLinks).toHaveLength(6);

      const expectedOrder = [
        { text: 'Home', href: '/#home' },
        { text: 'Products', href: '/#products' },
        { text: 'Our Story', href: '/story' },
        { text: 'Pricing', href: '/#pricing' },
        { text: 'FAQ', href: '/faq' },
        { text: 'Contact', href: '/contact' }
      ];

      expectedOrder.forEach((expected, index) => {
        expect(menuLinks?.[index]).toHaveTextContent(expected.text);
        expect(menuLinks?.[index]).toHaveAttribute('href', expected.href);
      });
    });

    it('should have correct href targets for new navigation links', () => {
      // Test Pricing link
      const pricingLink = screen.getByRole('link', { name: 'Navigate to Pricing page' });
      expect(pricingLink).toHaveAttribute('href', '/#pricing');

      // Test FAQ link
      const faqLink = screen.getByRole('link', { name: 'Navigate to FAQ page' });
      expect(faqLink).toHaveAttribute('href', '/faq');

      // Test Contact link  
      const contactLink = screen.getByRole('link', { name: 'Navigate to Contact page' });
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('should maintain existing link targets', () => {
      // Test existing links haven't changed
      const homeLink = screen.getByRole('link', { name: 'Navigate to Home page' });
      expect(homeLink).toHaveAttribute('href', '/#home');

      const productsLink = screen.getByRole('link', { name: 'Navigate to Products page' });
      expect(productsLink).toHaveAttribute('href', '/#products');

      const storyLink = screen.getByRole('link', { name: 'Navigate to Our Story page' });
      expect(storyLink).toHaveAttribute('href', '/story');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper aria-labels for all menu links', () => {
      const menuLinks = [
        'Navigate to Home page',
        'Navigate to Products page', 
        'Navigate to Our Story page',
        'Navigate to Pricing page',
        'Navigate to FAQ page',
        'Navigate to Contact page'
      ];

      menuLinks.forEach(ariaLabel => {
        const link = screen.getByRole('link', { name: ariaLabel });
        expect(link).toHaveAttribute('aria-label', ariaLabel);
      });
    });

    it('should have proper aria-labels for important links', () => {
      const importantLinks = [
        'Read our Privacy Policy',
        'Read our Terms and Conditions',
        'Read our Return Policy', 
        'Read our Cookies Policy'
      ];

      importantLinks.forEach(ariaLabel => {
        const link = screen.getByRole('link', { name: ariaLabel });
        expect(link).toHaveAttribute('aria-label', ariaLabel);
      });
    });

    it('should ensure all links are keyboard accessible', () => {
      const allLinks = screen.getAllByRole('link');
      
      allLinks.forEach(link => {
        // Links should be focusable
        expect(link).not.toHaveAttribute('tabindex', '-1');
        // Links should have href attribute for keyboard navigation
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Footer Structure', () => {
    it('should render footer sections in correct structure', () => {
      // Test main sections exist
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByText('Links')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();

      // Test logo is present
      expect(screen.getByAltText('Yum-mi Logo')).toBeInTheDocument();

      // Test company details
      expect(screen.getByText(/Quantallin OÜ/)).toBeInTheDocument();
      expect(screen.getByText(/support@yum-mi\.com/)).toBeInTheDocument();
    });

    it('should display copyright information', () => {
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`Yum-mi, Copyright © ${currentYear}. All Rights Reserved.`)).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('should apply consistent styling to all menu links', () => {
      const menuLinks = screen.getAllByRole('link').filter(link => 
        link.getAttribute('aria-label')?.includes('Navigate to')
      );

      menuLinks.forEach(link => {
        const computedStyle = window.getComputedStyle(link);
        // Check that styling is applied (these will be inline styles)
        expect(link).toHaveStyle('font-weight: 600');
        expect(link).toHaveStyle('color: rgb(15, 23, 42)'); // #0f172a
      });
    });
  });
});
