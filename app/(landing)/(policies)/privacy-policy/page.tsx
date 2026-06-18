import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FastBird collects, uses, and protects your personal data when you buy and use eSIM data plans.",
};

const sections: LegalSection[] = [
  {
    heading: "What this covers",
    body: [
      "This policy explains what personal information FastBird handles when you create an account, top up Points, and buy eSIM data plans, and the choices you have over that information.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "Account details you provide such as your name and email address.",
      "Transaction records including top-ups, plan purchases, and the Points involved. Card details themselves are processed by our payment providers and are not stored by FastBird.",
      "Technical data such as device and usage information needed to deliver and support your eSIM.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "To deliver your eSIM, manage your Points balance, provide support, and keep your account secure.",
      "To meet legal and accounting obligations and to prevent fraud and abuse.",
    ],
  },
  {
    heading: "Sharing",
    body: [
      "We share data only with the providers needed to run the service — such as payment processors and connectivity partners — and only as far as required to fulfil your order.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Depending on where you live, you may request access to, correction of, or deletion of your personal data. Contact us to exercise these rights.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For privacy questions or requests, email support@myfastbird.com.",
    ],
  },
];

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Privacy Policy"
    intro="Your data, handled with the same clarity we bring to everything else. Here's what we collect and why."
    lastUpdated="June 2026"
    sections={sections}
  />
);

export default PrivacyPolicyPage;
