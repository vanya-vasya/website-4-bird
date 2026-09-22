import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How FastBird collects, uses, shares, and protects your personal data when you buy and use eSIM data plans, including data tied to payments and refunds.",
};

const sections: LegalSection[] = [
  {
    heading: "What this covers",
    body: [
      "This Privacy Policy explains what personal information FastBird collects when you create an account, top up Points, and buy eSIM data plans, how we use and protect that information, who we share it with, and the choices and rights you have.",
      "It applies to the FastBird website and services. By using FastBird you acknowledge the practices described here.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      "Account details you provide, such as your name and email address.",
      "Transaction records, including top-ups, plan purchases, and the Points involved. Full card details are processed by our payment providers and are not stored by FastBird — we keep only limited information such as a payment reference and the method used, which is needed to process any refund.",
      "Technical and usage data, such as device information, eSIM installation and activation status, and log data, used to deliver and support your plans.",
      "Support communications, such as the emails you send to support@myfastbird.com.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "To deliver your eSIM, manage your prepaid Points balance, process purchases, and provide customer support.",
      "To handle refund and return requests — for example, matching a request to the original transaction so that money can be returned to the original payment method and the Points balance adjusted accordingly.",
      "To keep your account secure, prevent fraud and abuse, and meet our legal, tax, and accounting obligations.",
      "To improve the service and, where required, only with your consent, for analytics.",
    ],
  },
  {
    heading: "Payments and refunds data",
    body: [
      "When you top up Points or receive a refund, we and our payment providers process the data needed to complete that transaction. Refunds are only ever issued to the original payment method used for the top-up, so we retain enough transaction information to identify and reverse the correct payment.",
      "We keep records of purchases, refunds, and the resulting Points adjustments (including where a refund resets a Points balance to zero) for as long as needed to run the service and comply with legal and accounting requirements.",
    ],
  },
  {
    heading: "Sharing",
    body: [
      "We share data only with the providers needed to run the service — such as payment processors, connectivity and eSIM partners, and support tools — and only as far as required to fulfil your order or request.",
      "We may disclose information where required by law, to protect our rights, or as part of a business transfer. We do not sell your personal data.",
    ],
  },
  {
    heading: "Data retention and security",
    body: [
      "We retain personal data for as long as your account is active and as required afterwards for legal, tax, and fraud-prevention purposes.",
      "We use reasonable technical and organisational measures to protect your data, though no method of transmission or storage is completely secure.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Depending on where you live, you may request access to, correction of, deletion of, or a copy of your personal data, and you may object to or restrict certain processing.",
      "Note that we may need to keep some transaction and refund records even after account deletion to meet legal obligations. To exercise your rights, contact us using the details below.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For privacy questions, data requests, or refund-related data queries, email support@myfastbird.com.",
    ],
  },
];

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Privacy Policy"
    intro="Your data, handled with the same clarity we bring to everything else. Here's what we collect, why, and how it relates to payments and refunds."
    lastUpdated="September 2026"
    sections={sections}
  />
);

export default PrivacyPolicyPage;
