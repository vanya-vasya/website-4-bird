"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Leaf,
  Calendar,
  Hash,
  Star,
  ClipboardList,
  ChevronRight,
  Coffee,
  UtensilsCrossed,
  Apple,
  Moon,
  Zap,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Target,
} from "lucide-react";
import { FriendlyResponse } from "@/lib/friendly-response-formatter";

/* ────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────── */

interface NutritionistReportCardProps {
  response: FriendlyResponse;
  /** Raw text/markdown from the n8n webhook — rendered as structured report body */
  rawContent?: string;
  gradient?: string;
  className?: string;
  toolTitle?: string;
}

type ContentBlock =
  | { kind: "intro"; text: string }
  | { kind: "day"; label: string; meals: MealBlock[] }
  | { kind: "meal"; label: string; items: string[] }
  | { kind: "list"; items: string[] }
  | { kind: "note"; items: string[] };

interface MealBlock {
  label: string;
  items: string[];
}

/* ────────────────────────────────────────────────────────────────
   Helpers & parser
──────────────────────────────────────────────────────────────── */

const generateReportId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
};

const formatReportDate = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const MEAL_RE =
  /^(Breakfast|Lunch|Dinner|Supper|Snack|Morning snack|Afternoon snack|Evening snack|Pre-workout|Post-workout|Brunch)\s*:/i;

const DAY_RE =
  /^(Day\s*\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Week\s*\d+)/i;

const NOTE_RE =
  /^(Note:|Tip:|Important:|Remember:|Drink|Adjust|Good luck|Feel free|This plan|For best results)/i;

const inlineFormat = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/—/g, "–");

/**
 * Splits the raw n8n response (which may use inline • bullets without newlines)
 * into structured ContentBlocks for rendering.
 */
const parseRawContent = (raw: string): ContentBlock[] => {
  // 1. Normalise markdown noise
  const clean = raw
    .replace(/\*\*/g, "**") // keep temporarily for bold detection
    .replace(/#/g, "")
    .replace(/—/g, "–")
    .trim();

  // 2. Tokenise: split on newlines AND inline bullet chars
  const tokens = clean
    .split(/[\n\r]|(?<!\d)[•·](?!\d)/) // split on bullets but NOT decimal dots
    .map((t) => t.replace(/^\s*[-–]\s/, "").trim()) // strip leading dash/en-dash
    .filter(Boolean);

  if (!tokens.length) return [];

  const blocks: ContentBlock[] = [];
  let currentDay: { label: string; meals: MealBlock[] } | null = null;
  let currentMeal: MealBlock | null = null;
  let floatingItems: string[] = [];
  let noteItems: string[] = [];
  let introConsumed = false;

  const flushFloating = () => {
    if (floatingItems.length) {
      blocks.push({ kind: "list", items: [...floatingItems] });
      floatingItems = [];
    }
  };

  const flushMeal = () => {
    if (currentMeal) {
      if (currentDay) {
        currentDay.meals.push(currentMeal);
      } else {
        blocks.push({ kind: "meal", label: currentMeal.label, items: currentMeal.items });
      }
      currentMeal = null;
    }
  };

  const flushDay = () => {
    flushMeal();
    if (currentDay) {
      blocks.push({ kind: "day", label: currentDay.label, meals: currentDay.meals });
      currentDay = null;
    }
  };

  for (const token of tokens) {
    // ── Day header ──────────────────────────────────────────────
    if (DAY_RE.test(token) && token.length < 60) {
      flushDay();
      flushFloating();
      currentDay = { label: token.replace(/:\s*$/, ""), meals: [] };
      continue;
    }

    // ── Meal type header ────────────────────────────────────────
    if (MEAL_RE.test(token)) {
      flushMeal();
      flushFloating();
      const colonIdx = token.indexOf(":");
      const label = token.slice(0, colonIdx).trim();
      const rest = token.slice(colonIdx + 1).trim();
      currentMeal = { label, items: rest ? [rest] : [] };
      continue;
    }

    // ── Notes / tips ────────────────────────────────────────────
    if (NOTE_RE.test(token)) {
      flushDay();
      flushFloating();
      noteItems.push(token);
      continue;
    }

    // ── Intro (first long sentence before any structure) ────────
    if (
      !introConsumed &&
      !currentDay &&
      !currentMeal &&
      floatingItems.length === 0 &&
      token.length > 40 &&
      !token.match(/^[\d½¼¾]/)
    ) {
      blocks.push({ kind: "intro", text: token });
      introConsumed = true;
      continue;
    }

    // ── Regular food item ────────────────────────────────────────
    if (currentMeal) {
      currentMeal.items.push(token);
    } else {
      floatingItems.push(token);
    }
  }

  flushDay();
  flushFloating();
  if (noteItems.length) blocks.push({ kind: "note", items: noteItems });

  return blocks;
};

/* ────────────────────────────────────────────────────────────────
   Meal icon helper
──────────────────────────────────────────────────────────────── */

const MEAL_ICONS: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="h-4 w-4" aria-hidden="true" />,
  brunch: <Coffee className="h-4 w-4" aria-hidden="true" />,
  lunch: <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />,
  dinner: <Moon className="h-4 w-4" aria-hidden="true" />,
  supper: <Moon className="h-4 w-4" aria-hidden="true" />,
  snack: <Apple className="h-4 w-4" aria-hidden="true" />,
  "morning snack": <Apple className="h-4 w-4" aria-hidden="true" />,
  "afternoon snack": <Apple className="h-4 w-4" aria-hidden="true" />,
  "evening snack": <Apple className="h-4 w-4" aria-hidden="true" />,
  "pre-workout": <Zap className="h-4 w-4" aria-hidden="true" />,
  "post-workout": <Zap className="h-4 w-4" aria-hidden="true" />,
};

const getMealIcon = (label: string) =>
  MEAL_ICONS[label.toLowerCase()] ?? (
    <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
  );

const MEAL_COLORS: Record<string, string> = {
  breakfast: "border-amber-200 bg-amber-50",
  brunch: "border-amber-200 bg-amber-50",
  lunch: "border-emerald-200 bg-emerald-50",
  dinner: "border-indigo-200 bg-indigo-50",
  supper: "border-indigo-200 bg-indigo-50",
  snack: "border-orange-200 bg-orange-50",
  "morning snack": "border-orange-200 bg-orange-50",
  "afternoon snack": "border-orange-200 bg-orange-50",
  "evening snack": "border-orange-200 bg-orange-50",
  "pre-workout": "border-purple-200 bg-purple-50",
  "post-workout": "border-purple-200 bg-purple-50",
};

const getMealColors = (label: string) =>
  MEAL_COLORS[label.toLowerCase()] ?? "border-gray-200 bg-gray-50";

const MEAL_ICON_BG: Record<string, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  brunch: "bg-amber-100 text-amber-700",
  lunch: "bg-emerald-100 text-emerald-700",
  dinner: "bg-indigo-100 text-indigo-700",
  supper: "bg-indigo-100 text-indigo-700",
  snack: "bg-orange-100 text-orange-700",
  "morning snack": "bg-orange-100 text-orange-700",
  "afternoon snack": "bg-orange-100 text-orange-700",
  "evening snack": "bg-orange-100 text-orange-700",
  "pre-workout": "bg-purple-100 text-purple-700",
  "post-workout": "bg-purple-100 text-purple-700",
};

const getMealIconBg = (label: string) =>
  MEAL_ICON_BG[label.toLowerCase()] ?? "bg-gray-100 text-gray-700";

/* ────────────────────────────────────────────────────────────────
   Sanitise
──────────────────────────────────────────────────────────────── */

const sanitize = (html: string): string =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "");

const LEADING_EMOJI_RE =
  /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0F\s]+/u;

const stripLeadingEmoji = (text: string) =>
  text.replace(LEADING_EMOJI_RE, "").trim();

/* ────────────────────────────────────────────────────────────────
   Sub-components
──────────────────────────────────────────────────────────────── */

const ReportSection = ({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) => (
  <section aria-labelledby={`rs-${index}`}>
    <div className="flex items-center gap-3 mb-5">
      <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.15em]">
        §{String(index).padStart(2, "0")}
      </span>
      <ChevronRight className="h-3 w-3 text-emerald-300" aria-hidden="true" />
      <h2
        id={`rs-${index}`}
        className="text-sm font-extrabold text-gray-800 uppercase tracking-wide"
      >
        {title}
      </h2>
      <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
    </div>
    {children}
  </section>
);

/** A single meal block (e.g. Breakfast, Lunch) */
const MealCard = ({ meal }: { meal: MealBlock }) => (
  <div
    className={cn(
      "rounded-xl border p-4",
      getMealColors(meal.label)
    )}
  >
    <div className="flex items-center gap-2 mb-3">
      <span
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0",
          getMealIconBg(meal.label)
        )}
      >
        {getMealIcon(meal.label)}
      </span>
      <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">
        {meal.label}
      </h4>
    </div>
    <ul className="space-y-1.5 pl-1">
      {meal.items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="text-emerald-500 mt-1 flex-shrink-0 text-xs">●</span>
          <span dangerouslySetInnerHTML={{ __html: sanitize(inlineFormat(item)) }} />
        </li>
      ))}
    </ul>
  </div>
);

/** A day section with its meal blocks */
const DayCard = ({ day, index }: { day: Extract<ContentBlock, { kind: "day" }>; index: number }) => (
  <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">
        {index}
      </div>
      <h3 className="text-white font-bold text-sm uppercase tracking-wide">
        {day.label}
      </h3>
    </div>
    <div className="p-4 grid sm:grid-cols-2 gap-3 bg-white">
      {day.meals.map((meal, mi) => (
        <MealCard key={mi} meal={meal} />
      ))}
    </div>
  </div>
);

/** Generic bullet list */
const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span dangerouslySetInnerHTML={{ __html: sanitize(inlineFormat(item)) }} />
      </li>
    ))}
  </ul>
);

/** Renders parsed ContentBlocks */
const ContentRenderer = ({ blocks }: { blocks: ContentBlock[] }) => {
  const days = blocks.filter((b) => b.kind === "day") as Extract<ContentBlock, { kind: "day" }>[];
  const hasDays = days.length > 0;

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.kind === "intro") {
          return (
            <div
              key={i}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-6 py-4"
            >
              <p className="text-gray-800 text-sm leading-relaxed font-medium">
                {stripLeadingEmoji(block.text)}
              </p>
            </div>
          );
        }

        if (block.kind === "day") {
          const dayIndex = days.indexOf(block) + 1;
          return <DayCard key={i} day={block} index={dayIndex} />;
        }

        if (block.kind === "meal") {
          return <MealCard key={i} meal={{ label: block.label, items: block.items }} />;
        }

        if (block.kind === "list") {
          if (!hasDays) {
            // No day structure → show as a 2-col grid of food items
            return (
              <div key={i} className="grid sm:grid-cols-2 gap-2">
                {block.items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700"
                  >
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 text-xs font-bold">
                      {String(j + 1).padStart(2, "0")}
                    </span>
                    <span
                      dangerouslySetInnerHTML={{ __html: sanitize(inlineFormat(item)) }}
                    />
                  </div>
                ))}
              </div>
            );
          }
          return <BulletList key={i} items={block.items} />;
        }

        if (block.kind === "note") {
          return (
            <div
              key={i}
              className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Tips & Notes
                </span>
              </div>
              {block.items.map((note, j) => (
                <div key={j} className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span dangerouslySetInnerHTML={{ __html: sanitize(inlineFormat(note)) }} />
                </div>
              ))}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────
   Main component
──────────────────────────────────────────────────────────────── */

export const NutritionistReportCard = ({
  response,
  rawContent,
  gradient = "from-emerald-400 via-green-500 to-teal-600",
  className,
  toolTitle = "Your Own Nutritionist",
}: NutritionistReportCardProps) => {
  const reportId = React.useMemo(() => generateReportId(), []);
  const reportDate = React.useMemo(() => formatReportDate(), []);
  const parsedBlocks = React.useMemo(
    () => (rawContent ? parseRawContent(rawContent) : null),
    [rawContent]
  );

  let sectionIndex = 1;

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden",
        className
      )}
      role="article"
      aria-label="Nutritional Analysis Report"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-r",
          gradient
        )}
      >
        {/* watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <span className="text-[160px] font-black text-white tracking-widest rotate-[-20deg]">
            REPORT
          </span>
        </div>

        <div className="relative z-10 p-8 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em]">
                  Yum-Mi AI Platform
                </p>
                <p className="text-white font-bold text-lg leading-tight">
                  {toolTitle}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider ring-1 ring-white/30">
              <Star className="h-3 w-3" aria-hidden="true" />
              Official Report
            </span>
          </div>

          <div className="border-t border-white/20 pt-5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
              Nutritional Analysis Report
            </h1>
            <p className="text-white/80 text-sm max-w-2xl">
              Personalised evidence-based nutrition guidance prepared exclusively
              for you by Yum-Mi AI.
            </p>
          </div>
        </div>

        {/* meta strip */}
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

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="p-8 space-y-8">

        {/* §1 Executive Summary */}
        <ReportSection index={sectionIndex++} title="Executive Summary">
          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl px-6 py-5">
            <p className="text-gray-800 text-base leading-relaxed font-medium">
              {stripLeadingEmoji(response.greeting)}
            </p>
          </div>
        </ReportSection>

        {/* §2 Meal Plan (raw structured content) */}
        {parsedBlocks && parsedBlocks.length > 0 ? (
          <ReportSection index={sectionIndex++} title="Your Personalised Meal Plan">
            <ContentRenderer blocks={parsedBlocks} />
          </ReportSection>
        ) : response.mainContent ? (
          /* fallback: formatted HTML from the friendly formatter */
          <ReportSection index={sectionIndex++} title="Nutritional Analysis & Recommendations">
            <div
              dangerouslySetInnerHTML={{ __html: sanitize(response.mainContent) }}
              className={cn(
                "prose prose-sm max-w-none text-gray-700 leading-relaxed",
                "prose-headings:text-emerald-800 prose-headings:font-bold",
                "prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2",
                "prose-ul:space-y-1 prose-ul:my-3",
                "prose-li:text-gray-700 prose-li:marker:text-emerald-500",
                "prose-p:mb-4 prose-strong:text-emerald-700"
              )}
            />
          </ReportSection>
        ) : null}

        {/* §3 Action Plan */}
        {response.actionItems.length > 0 && (
          <ReportSection index={sectionIndex++} title="Personalised Action Plan">
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
                    className="flex-1 text-gray-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitize(stripLeadingEmoji(item)),
                    }}
                  />
                  <CheckCircle2 className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-0.5 transition-colors duration-200" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </ReportSection>
        )}

        {/* §4 Next Steps */}
        {response.nextSteps && (
          <ReportSection index={sectionIndex++} title="Recommended Next Steps">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-amber-900 text-sm leading-relaxed">
                  {stripLeadingEmoji(response.nextSteps)}
                </p>
              </div>
            </div>
          </ReportSection>
        )}

        {/* Closing */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2" aria-hidden="true">
            {response.emoji}
          </div>
          <p className="text-purple-900 text-base font-semibold leading-relaxed max-w-xl mx-auto">
            {stripLeadingEmoji(response.encouragement)}
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 px-8 py-5 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Leaf className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          <span>
            Generated by{" "}
            <strong className="text-gray-500">Yum-Mi {toolTitle} AI</strong>
          </span>
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
