import type { AccordionItem } from "@/components/fastbird";

export type FaqCategory = {
  title: string;
  eyebrow: string;
  items: AccordionItem[];
};

export const faqCategories: FaqCategory[] = [
  {
    title: "eSIM basics",
    eyebrow: "// THE ESSENTIALS",
    items: [
      {
        question: "What exactly is an eSIM?",
        answer:
          "It's a SIM built into your phone instead of a plastic card you slot in. You add a data plan by scanning a QR code, so there's nothing to ship and nothing to swap. Your everyday number and SIM stay put.",
      },
      {
        question: "How is it different from the SIM I already have?",
        answer:
          "Your physical SIM keeps handling calls and texts on your home number. The FastBird eSIM sits alongside it and carries your travel data, so you stay reachable while paying local-style rates abroad.",
      },
      {
        question: "Will I keep my own phone number?",
        answer:
          "Yes. A FastBird eSIM only provides data. Your number, contacts, and messaging apps work exactly as before — you simply route mobile data through the travel plan.",
      },
    ],
  },
  {
    title: "Devices & compatibility",
    eyebrow: "// WILL IT WORK",
    items: [
      {
        question: "Which phones support eSIM?",
        answer:
          "Most handsets from the last few years do — recent iPhones, Google Pixels, and flagship Samsung Galaxy models, among others. The device also needs to be carrier-unlocked. If you're unsure, check your settings for an 'Add eSIM' or 'Add data plan' option.",
      },
      {
        question: "Can I use one plan on two devices?",
        answer:
          "A plan installs on a single device, but you can share that connection with a laptop or tablet using your phone's personal hotspot wherever the destination plan allows tethering.",
      },
    ],
  },
  {
    title: "Buying & activation",
    eyebrow: "// GETTING ONLINE",
    items: [
      {
        question: "How do I buy and activate a plan?",
        answer:
          "Pick your destination, choose a data plan, and pay with your Points balance. We send a QR code right away. Scan it from your phone's settings, and switch the line on when you land.",
      },
      {
        question: "Should I install before or after I travel?",
        answer:
          "Install while you still have Wi-Fi at home — it only takes a minute. Many plans start counting from first use or first connection at the destination, so you can set things up early and turn data on once you arrive.",
      },
    ],
  },
  {
    title: "Points & billing",
    eyebrow: "// HOW PAYMENT WORKS",
    items: [
      {
        question: "What are Points?",
        answer:
          "Points are your prepaid FastBird balance. You top up once, then spend Points on any destination plan. Larger top-ups carry more value, and your balance is ready whenever the next trip comes up.",
      },
      {
        question: "Do my Points expire?",
        answer:
          "Your balance is designed to stay available for your travels. Any time-bound conditions are shown clearly at top-up — we don't hide rules in the fine print.",
      },
      {
        question: "Can I get a refund?",
        answer:
          "If a plan can't be delivered or activated, contact support and we'll make it right. Refund eligibility is summarised on our Payments page and detailed in the Refund Policy.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    eyebrow: "// IF SOMETHING'S OFF",
    items: [
      {
        question: "My eSIM won't connect — what now?",
        answer:
          "Confirm the travel line is set as your data line, that data roaming is enabled for it, and that you've arrived in the plan's coverage area. A quick restart resolves most cases; if not, our support team is available around the clock.",
      },
      {
        question: "I changed phones mid-trip. Can I move the plan?",
        answer:
          "An installed eSIM is tied to the device it was added to. Reach out to support with your order details and we'll help you get connected on the new handset as quickly as possible.",
      },
    ],
  },
];

export const faqTeaser: AccordionItem[] = [
  faqCategories[0].items[0],
  faqCategories[2].items[0],
  faqCategories[3].items[0],
  faqCategories[1].items[0],
];
