import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that govern your use of FastBird's eSIM data plans, prepaid Points balance, refunds, and website.",
};

const sections: LegalSection[] = [
  {
    heading: "Agreement",
    body: [
      "These Terms & Conditions form a binding agreement between you and FastBird. By creating a FastBird account, topping up Points, or buying a plan, you confirm that you have read, understood, and agree to these terms. If you do not agree, please do not use the service.",
      "You must be old enough to enter into a binding contract in your country of residence to use FastBird.",
    ],
  },
  {
    heading: "The service",
    body: [
      "FastBird sells prepaid eSIM data plans by destination. Plans provide mobile data only and do not include calls or SMS on your existing phone number.",
      "Coverage, connection speeds, supported networks, and availability depend on the local mobile operators at each destination and may change without notice. Your device must be eSIM-capable and carrier-unlocked to use our plans.",
    ],
  },
  {
    heading: "Points and payment",
    body: [
      "Points are a prepaid balance. You buy Points using a supported payment method and then spend them on eSIM data plans. The price in Points and any conditions are shown before you confirm a purchase.",
      "Payments are handled by our third-party payment providers. FastBird does not store your full card details. You are responsible for ensuring you have authority to use the chosen payment method.",
      "You are responsible for keeping your account credentials secure and for all activity that takes place under your account.",
    ],
  },
  {
    heading: "Refunds, Points, and the eSIM return window",
    body: [
      "Refunds of money are always issued to the original payment method used to top up your Points balance — never to a different card, account, or person.",
      "Because the service is prepaid, any refund resets your Points balance to zero: when a refund is approved, all remaining Points on your account are voided and cannot be used, transferred, or reinstated.",
      "If you have a problem with an eSIM, you may request a return or refund within 4 hours of the eSIM being delivered to your account; after that window the eSIM is treated as accepted and is no longer refundable. All refund and return requests must be sent by email to support@myfastbird.com. Full details are in our Refund & Return Policy.",
    ],
  },
  {
    heading: "Delivery and activation",
    body: [
      "eSIMs are delivered digitally to your FastBird account, usually within minutes of a successful purchase. It is your responsibility to install and activate the eSIM on a compatible device following the instructions provided.",
      "We recommend installing and testing your eSIM promptly so that any issue can be reported within the 4-hour return window.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "You agree to use plans lawfully and in line with the fair-use and acceptable-use conditions of the local networks.",
      "You must not resell, redistribute, or commercially exploit the service, use it for fraud, spam, or unlawful activity, or attempt to disrupt or reverse-engineer the platform.",
    ],
  },
  {
    heading: "Liability",
    body: [
      "FastBird provides the service with reasonable care and skill but cannot guarantee uninterrupted or error-free coverage, as this depends on local networks.",
      "To the maximum extent permitted by law, FastBird's total liability for any claim relating to a plan is limited to the value of the affected plan. We are not liable for indirect or consequential losses.",
    ],
  },
  {
    heading: "Changes and governing law",
    body: [
      "We may update these terms from time to time. Material changes will be communicated through the service, and continued use after changes take effect means you accept them.",
      "These terms are governed by the laws of the jurisdiction in which FastBird is registered, and the courts of that jurisdiction will have non-exclusive jurisdiction over any dispute.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about these terms, or any refund request, should be sent to support@myfastbird.com.",
    ],
  },
];

const TermsPage = () => (
  <LegalPage
    title="Terms & Conditions"
    intro="The straightforward terms for using FastBird — including how Points, refunds, and the 4-hour eSIM return window work. Plain language, no traps."
    lastUpdated="September 2026"
    sections={sections}
  />
);

export default TermsPage;
