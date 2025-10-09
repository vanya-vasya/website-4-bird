"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancelPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl text-orange-600">
            Payment Cancelled
          </CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges have been made to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              If you experienced any issues during the payment process, 
              please try again or contact our support team.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;

