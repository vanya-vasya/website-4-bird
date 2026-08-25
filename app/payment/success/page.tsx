import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";

const PaymentSuccessPage = () => (
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
      <CardContent>
        <Link href="/dashboard" className="block w-full">
          <Button className="w-full bg-forest text-on-dark hover:bg-green">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </Link>
      </CardContent>
    </Card>
  </div>
);

export default PaymentSuccessPage;
