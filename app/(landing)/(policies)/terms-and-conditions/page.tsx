import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that govern your use of FastBird's eSIM data plans, Points balance, and website.",
};

const sections: LegalSection[] = [
  {
    heading: "Agreement",
    body: [
      "By creating a FastBird account or buying a plan, you agree to these terms. If you don't agree, please don't use the service.",
    ],
  },
  {
    heading: "The service",
    body: [
      "FastBird sells prepaid eSIM data plans by destination. Plans provide data only and do not include calls or texts on your home number.",
      "Coverage, speeds, and availability depend on local networks at each destination and may vary.",
    ],
  },
  {
    heading: "Points and payment",
    body: [
      "Points are a prepaid balance you top up and spend on plans. Pricing and any applicable conditions are shown before you confirm a purchase.",
      "You are responsible for keeping your account credentials secure.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "You agree to use plans lawfully and not to resell or misuse the service.",
    ],
  },
  {
    heading: "Liability",
    body: [
      "FastBird provides the service with reasonable care but cannot guarantee uninterrupted coverage. To the extent permitted by law, our liability is limited to the value of the affected plan.",
    ],
  },
  {
    heading: "Changes",
    body: [
      "We may update these terms from time to time. Material changes will be communicated through the service.",
    ],
  },
];

const TermsPage = () => (
  <LegalPage
    title="Terms & Conditions"
    intro="The straightforward terms for using FastBird. Plain language, no traps."
    lastUpdated="June 2026"
    sections={sections}
  />
);

export default TermsPage;
