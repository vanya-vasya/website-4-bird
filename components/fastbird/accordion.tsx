"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
  defaultOpen?: number;
};

export const Accordion = ({ items, className, defaultOpen }: AccordionProps) => {
  const [open, setOpen] = useState<number | null>(
    defaultOpen ?? null
  );

  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left fb-focus"
            >
              <span className="font-heading text-lg font-medium text-ink">
                {item.question}
              </span>
              {isOpen ? (
                <Minus className="h-5 w-5 shrink-0 text-green" aria-hidden />
              ) : (
                <Plus className="h-5 w-5 shrink-0 text-green" aria-hidden />
              )}
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="fb-measure text-[15px] leading-relaxed text-ink-soft">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
