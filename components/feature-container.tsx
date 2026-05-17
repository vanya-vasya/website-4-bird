"use client";

import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureContainerProps {
  children: React.ReactNode;
  title: string;
  description: string;
  iconName: keyof typeof LucideIcons;
  gradient?: string;
  notice?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function FeatureContainer({
  children,
  title,
  description,
  iconName,
  gradient = "from-cyan-400 via-blue-500 to-indigo-600",
  notice,
}: FeatureContainerProps) {
  const IconComponent = LucideIcons[iconName] as React.ComponentType<{ className?: string }>;
  
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 justify-center">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${gradient} opacity-20 blur-lg`}></div>
            <div className={`relative bg-gradient-to-r ${gradient} p-3 rounded-full backdrop-blur-sm`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${gradient} inline`}>
            {title}
            </span>
          </h1>
        </div>
        <p className="text-center text-muted-foreground max-w-[700px] mx-auto whitespace-pre-line">
          {description}
        </p>
        {notice && (
          <div className="flex justify-center mt-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium shadow-sm max-w-[600px]">
              <LucideIcons.Info className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{notice}</span>
            </div>
          </div>
        )}
      </div>

      <motion.div variants={item} className="px-4">
        {children}
      </motion.div>
    </motion.div>
  );
} 