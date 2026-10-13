import { PAYMENT_CURRENCY, TOKEN_RATE } from "@/constants/pricing";

type StartTopUpCheckoutOptions = {
  userId: string;
  email?: string;
  // Number of Points/tokens to credit on success.
  points: number;
  // Points to actually charge for (defaults to `points`; lets packs grant bonus).
  chargePoints?: number;
};

// Creates a Secure-Processor hosted checkout for a balance top-up and returns
// the redirect URL. Mirrors the "Buy More" flow so every top-up entry point
// behaves the same way.
export const startTopUpCheckout = async ({
  userId,
  email,
  points,
  chargePoints,
}: StartTopUpCheckoutOptions): Promise<string> => {
  const charge = chargePoints ?? points;
  const amountEur = charge * TOKEN_RATE;

  const response = await fetch("/api/payment/secure-processor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountEur,
      currency: PAYMENT_CURRENCY,
      // Format matters: the webhook parses the Clerk id back out of "gen_<clerkId>_<ts>"
      orderId: `gen_${userId}_${Date.now()}`,
      // Format matters: the webhook extracts the credited amount from "(N EUR)"
      // (legacy "(N Tokens)" descriptions are still accepted).
      description: `FastBird Top-up (${amountEur} EUR)`,
      customerEmail: email ?? "",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success || !data.redirect_url) {
    throw new Error(
      data.error || "Failed to start payment. Please try again."
    );
  }

  return data.redirect_url as string;
};