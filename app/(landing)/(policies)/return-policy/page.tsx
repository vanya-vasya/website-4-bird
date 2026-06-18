import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "When FastBird offers refunds on Points and eSIM data plans, and how to request one.",
};

const sections: LegalSection[] = [
  {
    heading: "Our approach",
    body: [
      "Because eSIM plans are digital and delivered instantly, refunds focus on cases where a plan can't be delivered or activated. If something on our side goes wrong, we'll fix it or refund the Points involved.",
    ],
  },
  {
    heading: "Eligible for a refund",
    body: [
      "A plan that failed to deliver or could not be activated due to a technical issue on our side.",
      "A duplicate purchase made in error and not yet used.",
    ],
  },
  {
    heading: "Not usually eligible",
    body: [
      "Plans that have already been activated or used.",
      "Issues caused by an incompatible or locked device — check compatibility before buying.",
    ],
  },
  {
    heading: "How to request",
    body: [
      "Contact support@myfastbird.com with your order details. We'll review and respond promptly, and process eligible refunds back to your original method or Points balance.",
    ],
  },
];

const RefundPolicyPage = () => (
  <LegalPage
    title="Refund Policy"
    intro="Fair and clear. Here's when refunds apply and how to ask for one."
    lastUpdated="June 2026"
    sections={sections}
  />
);

export default RefundPolicyPage;
