"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";  
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProModal } from "@/hooks/use-pro-modal";
import { GENERATIONS_PRICE, toolsModal } from "@/constants";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { currencies, currenciesRate, Currency } from "@/constants/index";
import Image from "next/image";
import { z } from "zod";
import { useAuth, useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SecureProcessorPaymentWidget } from "@/components/secure-processor-payment-widget";
import {
  Checkbox,
  Field,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";

const formSchema = z.object({
  tokens: z
    .number()
    .min(0, { message: "Token count must be zero or greater" }),
  currency: z.enum(currencies),
  policies: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export const ProModal = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const proModal = useProModal();
  const [loading, setLoading] = useState(false);
  const [tokenPrice, setTokenPrice] = useState(GENERATIONS_PRICE);
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokens: 0,
      currency: "GBP",
      policies: false,
    },
  });

  const onSubmit = async () => {
    try {
      setLoading(true);
      // Показываем платежный виджет вместо закрытия модала
      setShowPaymentWidget(true);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (currency: Currency) => {
    setValue("currency", currency);
    setTokenPrice(GENERATIONS_PRICE * currenciesRate[currency]);
  };

  const handleCheckboxChange = (checked: boolean) => {
    setValue("policies", checked);
  };

  // Calculate total price based on token count
  // GENERATIONS_PRICE is 0.20 GBP per token
  const calculatePrice = (tokens: number): number => {
    const currentCurrency = watch("currency");
    // For GBP, use the base price directly (0.20 per token)
    // For other currencies, convert from GBP to the target currency
    if (currentCurrency === "GBP") {
      return tokens * GENERATIONS_PRICE;
    }
    // Convert GBP price to other currency using exchange rates
    const priceInEUR = GENERATIONS_PRICE / currenciesRate["GBP"]; // Convert GBP to EUR base
    return tokens * priceInEUR * currenciesRate[currentCurrency];
  };

  // Обработчики для платежного виджета
  const handlePaymentSuccess = (transactionData: any) => {
    console.log('Payment successful:', transactionData);
    proModal.onClose();
    setShowPaymentWidget(false);
    router.refresh();
    toast.success("Tokens added successfully!");
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setShowPaymentWidget(false);
    toast.error("Payment failed. Please try again.");
  };

  const handlePaymentCancel = () => {
    console.log('Payment canceled');
    setShowPaymentWidget(false);
    toast("Payment was canceled");
  };

  const handleBackToForm = () => {
    setShowPaymentWidget(false);
  };

  const handleModalClose = () => {
    setShowPaymentWidget(false);
    proModal.onClose();
  };

  return (
    <Dialog open={proModal.isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="bg-white border-gray-200" style={{fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"}}>
        <DialogHeader>
          <DialogTitle className="flex justify-center items-center flex-col gap-y-4 pb-2 bg-white">
            <div className="flex items-center gap-x-2 font-bold text-xl text-gray-900 bg-white">
              {showPaymentWidget ? "Complete Payment" : "Buy More"}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {showPaymentWidget ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={handleBackToForm}
                variant="outline"
                size="sm"
                className="text-black border-gray-300 hover:bg-gray-50"
              >
                ← Back to Selection
              </Button>
              <div className="text-black text-sm">
                {watch("tokens")} Tokens - {(() => {
                  const curr = watch("currency");
                  const symbol = curr === "GBP" ? "£" : curr === "EUR" ? "€" : curr === "USD" ? "$" : "";
                  return `${symbol}${calculatePrice(watch("tokens")).toFixed(2)}`;
                })()}
              </div>
            </div>
            
            <SecureProcessorPaymentWidget
              amount={calculatePrice(watch("tokens"))}
              currency={watch("currency")}
              orderId={`gen_${userId}_${Date.now()}`}
              description={`Yum-mi Tokens Purchase (${watch("tokens")} Tokens)`}
              customerEmail={user?.emailAddresses[0].emailAddress || ""}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
          <div className="w-full items-center gap-1.5">
            {/* Price Display Section */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3">
                {/* Currency Selector on the Left */}
                <Listbox
                  {...register("currency")}
                  value={watch("currency")}
                  onChange={handleCurrencyChange}
                  disabled={loading}
                >
                  <div className="relative">
                    <ListboxButton
                      className="w-[80px] h-[52px] text-center rounded-lg border-2 text-sm font-medium flex items-center justify-center bg-white transition-all duration-200 appearance-none shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: '#000',
                        color: '#000',
                        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      {watch("currency")}
                    </ListboxButton>
                    <ListboxOptions className="absolute top-full left-0 z-10 mt-1 grid w-[80px] origin-top gap-0.5 rounded-lg border border-gray-300 bg-white p-1 shadow-lg outline-none">
                      {currencies.map((currency, idx) => (
                        <ListboxOption
                          key={idx}
                          className={({ active }) =>
                            `flex cursor-pointer items-center justify-center rounded-md text-sm transition py-1
                            bg-white text-black
                            ${
                              active
                                ? "bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-medium"
                                : "border border-transparent hover:bg-gray-50"
                            }`
                          }
                          value={currency}
                          style={{
                            fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                          }}
                        >
                          {currency}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>

                {/* Price Display on the Right */}
                <div 
                  className="text-4xl font-bold py-2"
                  style={{
                    color: '#000',
                    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  {calculatePrice(watch("tokens")).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Token Amount Input */}
            <Label htmlFor="tokens" className="text-black mb-2 block" style={{fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'}}>
              Enter token amount
            </Label>
            <div className="w-full">
              <input
                disabled={loading}
                type="number"
                id="tokens"
                placeholder="0"
                {...register("tokens", { valueAsNumber: true })}
                min={0}
                step={1}
                className="w-full px-4 py-2 border-2 rounded-lg text-center text-2xl font-bold transition-all duration-200 bg-white focus:outline-none focus:ring-2"
                style={{
                  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  borderColor: '#000',
                  color: '#000',
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#000';
                  target.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.2)';
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLInputElement;
                  target.style.borderColor = '#000';
                  target.style.boxShadow = 'none';
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (document.activeElement !== target) {
                    target.style.borderColor = 'rgba(0, 0, 0, 0.8)';
                  }
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (document.activeElement !== target) {
                    target.style.borderColor = '#000';
                  }
                }}
              />
            </div>
            {errors.tokens && (
              <p className="text-red-600 text-sm pt-1">
                {errors.tokens.message}
              </p>
            )}
          </div>
          <div className="mt-3">
            <Field className="flex items-center gap-2">
              <Checkbox
                {...register("policies")}
                checked={watch("policies")}
                onChange={handleCheckboxChange}
                className="group block w-[1rem] h-[1rem] rounded border border-gray-300 bg-white data-[checked]:bg-gradient-to-r data-[checked]:from-green-400 data-[checked]:via-green-500 data-[checked]:to-green-600"
              >
                <svg
                  className="stroke-white opacity-0 group-data-[checked]:opacity-100"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M3 8L6 11L11 3.5"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Checkbox>
              <Label
                className="text-black mb-2 block"
                style={{fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'}}
              >
                I agree to the{" "}
                <a
                  href="/terms-and-conditions"
                  className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent hover:underline hover:underline-offset-4"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy-policy"
                  className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent hover:underline hover:underline-offset-4"
                >
                  Privacy Policy
                </a>
                .
              </Label>
            </Field>
            {errors.policies && (
              <p className="text-red-600 text-sm">{errors.policies.message}</p>
            )}
          </div>
          <DialogFooter className="mt-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button
                disabled={loading}
                size="lg"
                type="submit"
                className="w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:via-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Buy Tokens
                <Zap className="w-4 h-4 ml-2 fill-white" />
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
        )}
        
        {!showPaymentWidget && (
          <>
            <Image
              alt="Visa, Visa Secure, Mastercard, ID Check, 3D Secure payment logos"
              className="w-full max-w-md m-auto mt-1"
              src="/cards_new.svg"
              width={2537}
              height={394}
            />
            <Label className="text-center text-black mb-2 block" style={{fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'}}>
            QUICK FIT LTD - DEPT 2, 43 OWSTON ROAD, CARCROFT, DONCASTER, UNITED KINGDOM, DN6 8DA
            </Label>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
