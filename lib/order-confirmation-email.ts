import type { SendMailOptions } from "nodemailer";
import { company } from "@/constants/company";

export type ConfirmationItem = {
  /** e.g. "United Kingdom — 5 GB / 30 days" */
  label: string;
  qty: number;
  /** Price per unit in EUR, e.g. "6.00" */
  priceEur: string;
};

type OrderConfirmationEmailParams = {
  to: string;
  from: string;
  receiptId: string;
  /** Total charged for the whole order, e.g. "18.00" */
  totalEur: string;
  /** Number of activation emails that follow this one */
  activationEmails: number;
  items: ConfirmationItem[];
  receiptPdf: Buffer;
};

// The single payment-confirmation email for an eSIM order: receipt attached,
// order summary inside. Activation instructions with QR codes arrive in
// separate emails — one per purchased eSIM.
export const buildOrderConfirmationEmail = ({
  to,
  from,
  receiptId,
  totalEur,
  activationEmails,
  items,
  receiptPdf,
}: OrderConfirmationEmailParams): SendMailOptions => {
  const lines = items
    .map(
      (item) =>
        `- ${item.label}${item.qty > 1 ? ` x${item.qty}` : ""} — ${item.priceEur} EUR`
    )
    .join("\n");
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

  return {
    from,
    to,
    subject: `FastBird order #${receiptId} — payment confirmed`,
    text: `Hi there,

Thank you — your payment was received and your order is confirmed.

Order: #${receiptId}

${lines}

Total: ${totalEur} EUR
eSIMs in this order: ${totalQty}

Your receipt is attached. Activation instructions with the QR code for each eSIM follow in ${activationEmails} separate email${
      activationEmails === 1 ? "" : "s"
    } — one per eSIM.

If you run into any issues or have questions, our support team is just an email away at ${company.email}. We're always ready to help.

${company.name}
${company.identification}
${company.address}`,
    attachments: [
      {
        filename: `receipt-${receiptId}.pdf`,
        content: receiptPdf,
        contentType: "application/pdf",
      },
    ],
  };
};