"use client";

import { useEffect } from "react";
import { PaymentHistoryAnalytics } from "@/lib/analytics";
import { Transaction } from "@prisma/client";

interface PaymentHistoryClientProps {
  transactions: Transaction[];
  children: React.ReactNode;
}

export default function PaymentHistoryClient({ transactions, children }: PaymentHistoryClientProps) {
  useEffect(() => {
    // Track page view when component mounts
    PaymentHistoryAnalytics.viewPaymentHistory(transactions.length);
    
    // Track data load
    PaymentHistoryAnalytics.loadPaymentHistory(
      true,
      transactions.length
    );
  }, [transactions.length]);

  return <>{children}</>;
}

