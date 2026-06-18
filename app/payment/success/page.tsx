"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Receipt } from "lucide-react";
import { Loader } from "@/components/loader";

interface TransactionData {
  transaction_id?: string;
  order_id?: string;
  amount?: string;
  currency?: string;
  status?: string;
  customer_email?: string;
}

const PaymentSuccessContent = () => {
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchTransactionData = async () => {
      const token = searchParams.get("token");
      const orderId = searchParams.get("order_id");

      if (!token && !orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const queryParam = token ? `token=${token}` : `orderId=${orderId}`;
        const response = await fetch(`/api/payment/secure-processor?${queryParam}`);
        const data = await response.json();
        if (data.success && data.transaction) {
          setTransactionData(data.transaction);
        }
      } catch {
        // show generic success
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-ink-soft">Checking payment status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-sage" />
          </div>
          <CardTitle className="font-heading text-2xl text-forest">
            Payment Successful
          </CardTitle>
          <CardDescription>
            Your transaction is confirmed. Points have been added to your balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {transactionData && (
            <div className="rounded-md bg-sand p-4 space-y-3 font-mono text-sm">
              {transactionData.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Transaction ID</span>
                  <span className="text-ink">{transactionData.transaction_id}</span>
                </div>
              )}
              {transactionData.amount && transactionData.currency && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Amount</span>
                  <span className="text-ink font-medium">
                    {transactionData.amount} {transactionData.currency}
                  </span>
                </div>
              )}
              {transactionData.status && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Status</span>
                  <span className="text-green capitalize">{transactionData.status}</span>
                </div>
              )}
              {transactionData.customer_email && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Email</span>
                  <span className="text-ink">{transactionData.customer_email}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-forest text-on-dark hover:bg-green">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/billing/payment-history" className="w-full">
              <Button variant="outline" className="w-full">
                <Receipt className="w-4 h-4 mr-2" />
                View Payment History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentSuccessPage = () => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <Loader />
      </div>
    }
  >
    <PaymentSuccessContent />
  </Suspense>
);

export default PaymentSuccessPage;
