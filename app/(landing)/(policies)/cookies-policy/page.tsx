import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How and why FastBird uses cookies and similar technologies, how they support purchases and refunds, and how you can control them.",
};

const sections: LegalSection[] = [
  {
    heading: "What cookies are",
    body: [
      "Cookies are small text files stored on your device when you visit a website. Similar technologies include local storage, pixels, and SDKs. Together they help websites work, remember your preferences, and understand how the site is used.",
    ],
  },
  {
    heading: "How we use them",
    body: [
      "Essential cookies keep you signed in, keep your session secure, and make the top-up and checkout flow work. Without them the site cannot function properly.",
      "Functional cookies remember preferences such as your chosen currency or region.",
      "Analytics cookies help us understand how the site is used so we can improve it. Where required by law, these are only set with your consent.",
    ],
  },
  {
    heading: "Cookies, purchases, and refunds",
    body: [
      "Essential cookies help secure the payment and top-up process and let us link your session to the correct order. This is important for support and for handling any refund request accurately.",
      "Cookies themselves do not store your card details or process refunds. Refund decisions and payments are handled through your account and our payment providers, not through cookies. Refunds are always returned to the original payment method used for the top-up, and, because our service is prepaid, an approved refund resets your Points balance to zero. eSIM problems must be reported within 4 hours of delivery by emailing support@myfastbird.com — see our Refund & Return Policy for full details.",
    ],
  },
  {
    heading: "Third-party cookies",
    body: [
      "Some cookies may be set by third parties we rely on, such as analytics and payment providers, when their tools are loaded on our site. Their use of data is governed by their own policies.",
    ],
  },
  {
    heading: "Managing cookies",
    body: [
      "You can control or delete cookies through your browser settings, and where we ask for consent you can change your choice at any time. Blocking essential cookies may stop parts of the site — including top-ups and checkout — from working.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For questions about cookies, or about how they relate to your orders and refunds, email support@myfastbird.com.",
    ],
  },
];

const CookiesPage = () => (
  <LegalPage
    title="Cookie Policy"
    intro="A clear note on the cookies we use, how they support your purchases and refunds, and the control you have over them."
    lastUpdated="September 2026"
    sections={sections}
  />
);

export default CookiesPage;
