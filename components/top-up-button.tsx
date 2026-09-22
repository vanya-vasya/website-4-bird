"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/fastbird";
import { startTopUpCheckout } from "@/lib/checkout";

type TopUpButtonProps = {
  // Points/tokens credited on success.
  points: number;
  // Points to charge for (defaults to `points`).
  chargePoints?: number;
  children: React.ReactNode;
  variant?: "primary" | "accent" | "secondary" | "outlineOnDark" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const TopUpButton = ({
  points,
  chargePoints,
  children,
  variant = "secondary",
  size = "md",
  className,
}: TopUpButtonProps) => {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (isSubmitting) return;

    if (!userId) {
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectUrl = await startTopUpCheckout({
        userId,
        email: user?.primaryEmailAddress?.emailAddress,
        points,
        chargePoints,
      });
      window.location.href = redirectUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Server connection error. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          Redirecting…
        </>
      ) : (
        children
      )}
    </Button>
  );
};
