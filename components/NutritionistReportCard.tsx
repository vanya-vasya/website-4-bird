"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Leaf,
  Calendar,
  Hash,
  Star,
  ChevronRight,
} from "lucide-react";
import { FriendlyResponse } from "@/lib/friendly-response-formatter";

interface NutritionistReportCardProps {
  response: FriendlyResponse;
  gradient?: string;
  className?: string;
  toolTitle?: string;
}

const generateReportId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const formatReportDate = () => {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const NutritionistReportCard = ({
  response,
  gradient = "from-emerald-400 via-green-500 to-teal-600",
  className,
  toolTitle = "Your Own Nutritionist",
}: NutritionistReportCardProps) => {
  const reportId = React.useMemo(() => generateReportId(), []);
  const reportDate = React.useMemo(() => formatReportDate(), []);

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden",
        "print:shadow-none print:border-gray-300",
        className
      )}
      role="article"
      aria-label="Nutritional Analysis Report"
    >
      {/* ── Report Header ─────────────────────────────────────── */}
      <div className={cn("bg-gradient-to-r p-0 relative overflow-hidden", `bg-gradient-to-r ${gradient}`)}>
        {/* Decorative watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <span className="text-[160px] font-black text-white tracking-widest rotate-[-20deg]">
            REPORT
          </span>
        </div>

        <div className="relative z-10 p-8 pb-6">
          {/* Top row: brand + stamp */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em]">
                  Yum-Mi AI Platform
                </p>
                <p className="text-white font-bold text-lg leading-tight">{toolTitle}</p>
              </div>
            </div>

            {/* "OFFICIAL REPORT" badge */}
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider ring-1 ring-white/30">
                <Star className="h-3 w-3" aria-hidden="true" />
                Official Report
              </span>
            </div>
          </div>

          {/* Report title */}
          <div className="border-t border-white/20 pt-5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
              Nutritional Analysis Report
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-2xl">
              Personalised evidence-based nutrition guidance prepared exclusively for you by Yum-Mi AI.
            </p>
          </div>
        </div>

        {/* Meta strip */}
        <div className="relative z-10 bg-black/15 backdrop-blur-sm px-8 py-3 flex flex-wrap gap-x-8 gap-y-1 text-white/80 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Hash className="h-3 w-3" aria-hidden="true" />
            Report ID: YM-{reportId}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Date: {reportDate}
          </span>
          <span className="flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" aria-hidden="true" />
            Type: Personalised Nutrition Plan
          </span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="p-8 space-y-8">

        {/* § 1  Executive Summary */}
        <ReportSection index={1} title="Executive Summary">
          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl px-6 py-5">
            <p className="text-gray-800 text-base leading-relaxed font-medium">
              {stripEmoji(response.greeting)}
            </p>
          </div>
        </ReportSection>

        {/* § 2  Nutritional Analysis */}
        {response.mainContent && (
          <ReportSection index={2} title="Nutritional Analysis & Recommendations">
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(response.mainContent) }}
              className={cn(
                "prose prose-sm max-w-none text-gray-700 leading-relaxed",
                "prose-headings:text-emerald-800 prose-headings:font-bold",
                "prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3",
                "prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2",
                "prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2 prose-h4:text-emerald-700",
                "prose-ul:space-y-1 prose-ul:my-3",
                "prose-li:text-gray-700 prose-li:marker:text-emerald-500",
                "prose-p:mb-4 prose-strong:text-emerald-700 prose-strong:font-semibold",
                "prose-em:text-emerald-600 prose-em:not-italic prose-em:font-medium"
              )}
            />
          </ReportSection>
        )}

        {/* § 3  Action Plan */}
        {response.actionItems.length > 0 && (
          <ReportSection index={3} title="Personalised Action Plan">
            <ol className="space-y-3" role="list">
              {response.actionItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors duration-200 group"
                  tabIndex={0}
                  aria-label={`Action ${i + 1}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center text-emerald-600 group-hover:text-white font-bold text-sm transition-colors duration-200">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="flex-1 text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none prose-strong:text-emerald-700 prose-em:text-emerald-600 prose-em:not-italic"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripEmoji(item)) }}
                  />
                  <CheckCircle2 className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-0.5 transition-colors duration-200" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </ReportSection>
        )}

        {/* § 4  Next Steps */}
        {response.nextSteps && (
          <ReportSection index={4} title="Recommended Next Steps">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div
                className="text-amber-900 text-sm leading-relaxed prose prose-sm max-w-none prose-strong:text-amber-700 prose-em:text-amber-600"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(stripEmoji(response.nextSteps)) }}
              />
            </div>
          </ReportSection>
        )}

        {/* Closing note */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2" aria-hidden="true">{response.emoji}</div>
          <p className="text-purple-900 text-base font-semibold leading-relaxed max-w-xl mx-auto">
            {stripEmoji(response.encouragement)}
          </p>
        </div>
      </div>

      {/* ── Report Footer ─────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-8 py-5 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Leaf className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span>Generated by <strong className="text-gray-500">Yum-Mi {toolTitle} AI</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>YM-{reportId}</span>
          <span className="hidden sm:block">·</span>
          <span>{reportDate}</span>
          <span className="hidden sm:block">·</span>
          <span>For informational purposes only</span>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ─────────────────────────────────────────── */

interface ReportSectionProps {
  index: number;
  title: string;
  children: React.ReactNode;
}

const ReportSection = ({ index, title, children }: ReportSectionProps) => (
  <section aria-labelledby={`section-${index}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.15em]">
          §{String(index).padStart(2, "0")}
        </span>
        <ChevronRight className="h-3 w-3 text-emerald-300" aria-hidden="true" />
      </div>
      <h2
        id={`section-${index}`}
        className="text-base font-extrabold text-gray-800 uppercase tracking-wide"
      >
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent ml-2" />
    </div>
    {children}
  </section>
);

/* ── Utilities ──────────────────────────────────────────────── */

/** Strip leading emoji clusters from a string (keeps inline emojis in text) */
const LEADING_EMOJI_RE = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0F\s]+/u;

const stripEmoji = (text: string): string =>
  text.replace(LEADING_EMOJI_RE, "").trim();

/** Very light sanitise — strip script/on* to avoid XSS from formatter output */
const sanitizeHtml = (html: string): string =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "");
