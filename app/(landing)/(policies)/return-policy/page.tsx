import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Refund & Return Policy",
  description:
    "When FastBird offers refunds on Points and eSIM data plans, how refunds affect your Points balance, the 4-hour eSIM return window, and how to request a refund by email.",
};

const sections: LegalSection[] = [
  {
    heading: "Our approach",
    body: [
      "FastBird runs on a prepaid Points balance: you top up Points with a payment method, and then spend those Points on eSIM data plans. Because eSIM plans are digital goods that are delivered and can be activated almost instantly, this policy explains exactly when money can be returned, what happens to your Points when it is, and the time limits that apply.",
      "We aim to be fair and clear. If something goes wrong on our side, we will always try to fix it first, and where a refund is due we will process it as described below.",
    ],
  },
  {
    heading: "Refunds to your original payment method",
    body: [
      "Money is always refunded to the same account and payment method that was used to top up your Points balance. We cannot send a refund to a different card, bank account, wallet, or person than the one used for the original top-up.",
      "Once approved, refunds are returned through our payment provider. The time it takes for the money to appear depends on your bank or card issuer and is outside FastBird's control (typically a few business days).",
    ],
  },
  {
    heading: "What happens to your Points when you are refunded",
    body: [
      "Because the service is built on prepaid Points, any refund of money resets your Points balance to zero. When a refund is approved, all remaining Points on your account are voided at the same time — they cannot be used, transferred, sold, or reinstated afterwards.",
      "In other words: a refund returns funds to your original payment method, and in exchange your Points are cleared to zero. You cannot keep Points and also receive the money back for them.",
    ],
  },
  {
    heading: "eSIM problems — 4-hour return window",
    body: [
      "If you experience a problem with an eSIM (for example it cannot be installed, delivered, or activated), you may request a return or refund within 4 hours of the eSIM being delivered to your account.",
      "After this 4-hour window has passed, the eSIM is considered accepted and is no longer eligible for a return or refund. We strongly recommend testing your eSIM as soon as you receive it so any issue can be raised within the window.",
    ],
  },
  {
    heading: "Eligible for a refund",
    body: [
      "A plan or eSIM that failed to deliver, install, or activate due to a technical issue on our side, reported within the 4-hour window.",
      "A duplicate purchase made in error that has not yet been used or activated.",
      "A top-up that was charged incorrectly or more than once.",
    ],
  },
  {
    heading: "Not usually eligible",
    body: [
      "eSIMs or plans reported after the 4-hour return window has closed.",
      "Plans that have already been activated, used, or partially consumed.",
      "Issues caused by an incompatible, carrier-locked, or misconfigured device — please check device compatibility before you buy.",
      "Change of mind after an eSIM has been successfully delivered and activated.",
    ],
  },
  {
    heading: "How to request a refund",
    body: [
      "All refund and return requests must be sent by email to support@myfastbird.com. Requests made through other channels may not be processed.",
      "Please include the email address on your FastBird account, the order or transaction reference, the destination and plan, and a short description of the problem (screenshots help). For eSIM issues, remember the request must be sent within 4 hours of delivery.",
      "We will review your request, respond promptly, and — where a refund is approved — return the funds to your original payment method and reset your Points balance to zero as described above.",
    ],
  },
];

const RefundPolicyPage = () => (
  <LegalPage
    title="Refund & Return Policy"
    intro="Fair and clear. Here's when money is refunded, what happens to your Points, the 4-hour eSIM return window, and how to ask."
    lastUpdated="September 2026"
    sections={sections}
  />
);

export default RefundPolicyPage;
