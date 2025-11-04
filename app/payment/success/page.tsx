"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Receipt } from 'lucide-react';
import { Loader } from '@/components/loader';

interface TransactionData {
  transaction_id?: string;
  order_id?: string;
  amount?: string;
  currency?: string;
  status?: string;
  customer_email?: string;
}

const PaymentSuccessPage = () => {
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchTransactionData = async () => {
      const token = searchParams.get('token');
      const orderId = searchParams.get('order_id');

      if (!token && !orderId) {
        // No transaction data, just show success
        setIsLoading(false);
        return;
      }

      try {
        const queryParam = token ? `token=${token}` : `orderId=${orderId}`;
        const response = await fetch(`/api/payment/secure-processor?${queryParam}`);
        const data = await response.json();

        if (data.success && data.transaction) {
          setTransactionData(data.transaction);
        } else {
          // Don't show error, just show generic success
          console.log('Could not fetch transaction data, showing generic success');
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error);
        // Don't show error, just show generic success
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Thank you for your payment. Your transaction has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {transactionData && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-gray-900">Transaction Details:</h3>
              
              {transactionData.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-sm">{transactionData.transaction_id}</span>
                </div>
              )}
              
              {transactionData.order_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm">{transactionData.order_id}</span>
                </div>
              )}
              
              {transactionData.amount && transactionData.currency && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">
                    {transactionData.amount} {transactionData.currency}
                  </span>
                </div>
              )}
              
              {transactionData.status && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-semibold capitalize">
                    {transactionData.status}
                  </span>
                </div>
              )}
              
              {transactionData.customer_email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-sm">{transactionData.customer_email}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">
              A payment confirmation has been sent to your email. 
              You can now use all platform features with your updated token balance.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
            
            <Link href="/dashboard/billing/payment-history" className="w-full">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
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

export default PaymentSuccessPage;

