import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How and why FastBird uses cookies and similar technologies, and how you can control them.",
};

const sections: LegalSection[] = [
  {
    heading: "What cookies are",
    body: [
      "Cookies are small files stored on your device that help websites work and remember your preferences.",
    ],
  },
  {
    heading: "How we use them",
    body: [
      "Essential cookies keep you signed in and the checkout working.",
      "Analytics cookies help us understand how the site is used so we can improve it. These are only set with your consent where required.",
    ],
  },
  {
    heading: "Managing cookies",
    body: [
      "You can control or delete cookies through your browser settings. Blocking essential cookies may affect how the site works.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For questions about cookies, email support@myfastbird.com.",
    ],
  },
];

const CookiesPage = () => (
  <LegalPage
    title="Cookie Policy"
    intro="A short note on the cookies we use and the control you have over them."
    lastUpdated="June 2026"
    sections={sections}
  />
);

export default CookiesPage;
