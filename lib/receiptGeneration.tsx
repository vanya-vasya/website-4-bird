"use server";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import Receipt from "@/components/pdf/receipt";

export async function generatePdfReceipt(
  receiptId: string,
  email: string,
  date: string,
  tokens: number,
  description: string,
  amount: number,
  currency: string
): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <Receipt
      receiptId={receiptId}
      date={date}
      email={email}
      tokens={tokens}
      description={description}
      amount={amount}
      currency={currency}
    />
  );
  return pdfBuffer;
}
