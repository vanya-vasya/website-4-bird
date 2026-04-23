"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Leaf,
  Calendar,
  Hash,
  Star,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Coffee,
  UtensilsCrossed,
  Apple,
  Moon,
  Zap,
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb,
  Target,
  Table2,
  List,
  FileText,
  Flame,
} from "lucide-react";
import { FriendlyResponse } from "@/lib/friendly-response-formatter";
import {
  NutritionReport,
  NutritionSection,
  MealPlanSection,
  ListSection,
  TextSection,
  TableSection,
  CalloutSection,
  PlanDay,
  DayMeal,
  CalloutVariant,
} from "@/lib/nutrition-report-types";

/* ────────────────────────────────────────────────────────────────
   Component props
──────────────────────────────────────────────────────────────── */

interface NutritionistReportCardProps {
  response: FriendlyResponse;
  /** Structured JSON report from N8N — primary rendering path */
  nutritionReport?: NutritionReport;
  /** Raw text/markdown fallback from N8N */
  rawContent?: string;
  gradient?: string;
  className?: string;
  toolTitle?: string;
}

/* ────────────────────────────────────────────────────────────────
   Header utilities
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

/* ────────────────────────────────────────────────────────────────
   Inline markdown → HTML (safe subset)
──────────────────────────────────────────────────────────────── */

const inlineMd = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");

const sanitize = (html: string): string =>
  html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/\s+on\w+='[^']*'/gi, "");

const safe = (text: string) => sanitize(inlineMd(text));

const LEADING_EMOJI_RE =
  /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\uFE0F\s]+/u;
const stripLeadingEmoji = (t: string) => t.replace(LEADING_EMOJI_RE, "").trim();

/* ────────────────────────────────────────────────────────────────
   Meal-type config
──────────────────────────────────────────────────────────────── */

interface MealConfig {
  icon: React.ReactNode;
  border: string;
  bg: string;
  iconBg: string;
  label: string;
}

const MEAL_CONFIG: Record<string, MealConfig> = {
  breakfast: {
    icon: <Coffee className="h-3.5 w-3.5" />,
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100 text-amber-700",
    label: "Breakfast",
  },
  brunch: {
    icon: <Coffee className="h-3.5 w-3.5" />,
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-amber-100 text-amber-700",
    label: "Brunch",
  },
  lunch: {
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-700",
    label: "Lunch",
  },
  dinner: {
    icon: <Moon className="h-3.5 w-3.5" />,
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100 text-indigo-700",
    label: "Dinner",
  },
  supper: {
    icon: <Moon className="h-3.5 w-3.5" />,
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-100 text-indigo-700",
    label: "Supper",
  },
  snack: {
    icon: <Apple className="h-3.5 w-3.5" />,
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-700",
    label: "Snack",
  },
  "morning snack": {
    icon: <Apple className="h-3.5 w-3.5" />,
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-700",
    label: "Morning Snack",
  },
  "afternoon snack": {
    icon: <Apple className="h-3.5 w-3.5" />,
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-700",
    label: "Afternoon Snack",
  },
  "evening snack": {
    icon: <Apple className="h-3.5 w-3.5" />,
    border: "border-orange-200",
    bg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-700",
    label: "Evening Snack",
  },
  "pre-workout": {
    icon: <Zap className="h-3.5 w-3.5" />,
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100 text-purple-700",
    label: "Pre-Workout",
  },
  "post-workout": {
    icon: <Zap className="h-3.5 w-3.5" />,
    border: "border-purple-200",
    bg: "bg-purple-50",
    iconBg: "bg-purple-100 text-purple-700",
    label: "Post-Workout",
  },
};

const getMealConfig = (type?: string | null): MealConfig => {
  const key = (type ?? "").toLowerCase();
  return (
    MEAL_CONFIG[key] ?? {
      icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
      border: "border-gray-200",
      bg: "bg-gray-50",
      iconBg: "bg-gray-100 text-gray-600",
      label: type ? type.charAt(0).toUpperCase() + type.slice(1) : "Meal",
    }
  );
};

/* ────────────────────────────────────────────────────────────────
   Callout variant config
──────────────────────────────────────────────────────────────── */

interface CalloutConfig {
  border: string;
  bg: string;
  titleColor: string;
  textColor: string;
  icon: React.ReactNode;
}

const CALLOUT_CONFIG: Record<CalloutVariant | "default", CalloutConfig> = {
  info: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    titleColor: "text-blue-800",
    textColor: "text-blue-900",
    icon: <Info className="h-4 w-4 text-blue-600" />,
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    titleColor: "text-amber-800",
    textColor: "text-amber-900",
    icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    titleColor: "text-emerald-800",
    textColor: "text-emerald-900",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  },
  tip: {
    border: "border-purple-200",
    bg: "bg-purple-50",
    titleColor: "text-purple-800",
    textColor: "text-purple-900",
    icon: <Lightbulb className="h-4 w-4 text-purple-600" />,
  },
  default: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    titleColor: "text-gray-800",
    textColor: "text-gray-700",
    icon: <Info className="h-4 w-4 text-gray-500" />,
  },
};

const getCalloutConfig = (variant?: CalloutVariant | string | null): CalloutConfig =>
  (variant ? CALLOUT_CONFIG[variant as CalloutVariant] : undefined) ?? CALLOUT_CONFIG.default;

/* ────────────────────────────────────────────────────────────────
   Section-type icon map (for the §XX header)
──────────────────────────────────────────────────────────────── */

const SECTION_ICON: Record<string, React.ReactNode> = {
  meal_plan: <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-500" />,
  list: <List className="h-3.5 w-3.5 text-emerald-500" />,
  text: <FileText className="h-3.5 w-3.5 text-emerald-500" />,
  table: <Table2 className="h-3.5 w-3.5 text-emerald-500" />,
  callout: <Lightbulb className="h-3.5 w-3.5 text-emerald-500" />,
};

/* ────────────────────────────────────────────────────────────────
   Sub-components — report chrome
──────────────────────────────────────────────────────────────── */

const ReportSection = ({
  index,
  title,
  type,
  children,
}: {
  index: number;
  title: string;
  type?: string;
  children: React.ReactNode;
}) => (
  <section aria-labelledby={`rs-${index}`}>
    <div className="flex items-center gap-2.5 mb-5">
      <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.15em] flex-shrink-0">
        §{String(index).padStart(2, "0")}
      </span>
      <ChevronRight className="h-3 w-3 text-emerald-300 flex-shrink-0" aria-hidden="true" />
      {type && SECTION_ICON[type] && (
        <span className="flex-shrink-0" aria-hidden="true">
          {SECTION_ICON[type]}
        </span>
      )}
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

/* ────────────────────────────────────────────────────────────────
   Section renderers
──────────────────────────────────────────────────────────────── */

/** Single meal block inside a day card */
const MealBlock = ({ meal }: { meal: DayMeal }) => {
  const cfg = getMealConfig(meal.label ?? meal.type);
  return (
    <div className={cn("rounded-xl border p-3.5", cfg.border, cfg.bg)}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
              cfg.iconBg
            )}
            aria-hidden="true"
          >
            {cfg.icon}
          </span>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {meal.label ?? cfg.label}
          </span>
        </div>
        {meal.calories != null && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white rounded-full px-2 py-0.5 border border-gray-100">
            <Flame className="h-3 w-3 text-orange-400" aria-hidden="true" />
            {meal.calories} kcal
          </span>
        )}
      </div>
      <ul className="space-y-1">
        {meal.items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
            <span className="text-emerald-400 mt-0.5 flex-shrink-0">●</span>
            <span dangerouslySetInnerHTML={{ __html: safe(item) }} />
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Collapsible day card inside a meal_plan section */
const DayCard = ({
  day,
  index,
  defaultOpen,
}: {
  day: PlanDay;
  index: number;
  defaultOpen: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const dayLabel =
    typeof day.day === "number" ? `Day ${day.day}` : day.day;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Day header — always visible, click to toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 flex items-center justify-between hover:from-emerald-500 hover:to-teal-500 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-expanded={open}
        aria-label={`Toggle ${dayLabel}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            {index}
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm uppercase tracking-wide">
              {dayLabel}
            </p>
            {day.label && (
              <p className="text-white/70 text-xs">{day.label}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {day.totalCalories != null && (
            <span className="hidden sm:inline-flex items-center gap-1 text-white/80 text-xs bg-white/15 rounded-full px-2.5 py-1">
              <Flame className="h-3 w-3" aria-hidden="true" />
              {day.totalCalories} kcal/day
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-white/80 transition-transform duration-200",
              open && "rotate-180"
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Meal grid — collapsible */}
      {open && (
        <div className="p-4 bg-white grid sm:grid-cols-2 gap-3">
          {day.meals.map((meal, mi) => (
            <MealBlock key={mi} meal={meal} />
          ))}
        </div>
      )}
    </div>
  );
};

/** meal_plan section */
const MealPlanRenderer = ({ section }: { section: MealPlanSection }) => (
  <div className="space-y-4">
    {section.intro && (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-5 py-4">
        <p className="text-gray-800 text-sm leading-relaxed">
          {section.intro}
        </p>
      </div>
    )}
    {section.days.map((day, i) => (
      <DayCard
        key={day.day ?? i}
        day={day}
        index={i + 1}
        defaultOpen={i === 0}
      />
    ))}
  </div>
);

/** list section */
const ListRenderer = ({ section }: { section: ListSection }) => (
  <ul className="space-y-2.5" role="list">
    {section.items.map((item, i) => (
      <li
        key={i}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors duration-150 group"
        tabIndex={0}
      >
        <CheckCircle2
          className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-0.5 transition-colors duration-150"
          aria-hidden="true"
        />
        <span
          className="text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: safe(item) }}
        />
      </li>
    ))}
  </ul>
);

/** text section */
const TextRenderer = ({ section }: { section: TextSection }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5">
    <div
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed prose-strong:text-emerald-700 prose-em:text-emerald-600 prose-em:not-italic prose-headings:text-gray-800 prose-headings:font-bold"
      dangerouslySetInnerHTML={{ __html: sanitize(inlineMd(section.content)) }}
    />
  </div>
);

/** table section */
const TableRenderer = ({ section }: { section: TableSection }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gradient-to-r from-emerald-600 to-teal-600">
          {section.headers.map((h, i) => (
            <th
              key={i}
              className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {section.rows.map((row, ri) => (
          <tr
            key={ri}
            className={cn(
              "border-t border-gray-100 transition-colors duration-100",
              ri % 2 === 0 ? "bg-white" : "bg-gray-50",
              "hover:bg-emerald-50"
            )}
          >
            {row.map((cell, ci) => (
              <td
                key={ci}
                className={cn(
                  "px-4 py-3 text-gray-700",
                  ci === 0 && "font-medium text-gray-900"
                )}
                dangerouslySetInnerHTML={{ __html: safe(cell) }}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** callout section */
const CalloutRenderer = ({ section }: { section: CalloutSection }) => {
  const cfg = getCalloutConfig(section.variant);
  return (
    <div className={cn("rounded-xl border p-5", cfg.border, cfg.bg)}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
          {cfg.icon}
        </span>
        <div
          className={cn("text-sm leading-relaxed", cfg.textColor)}
          dangerouslySetInnerHTML={{ __html: sanitize(inlineMd(section.content)) }}
        />
      </div>
    </div>
  );
};

/** Dispatches to the right renderer per section type */
const SectionRenderer = ({ section }: { section: NutritionSection }) => {
  switch (section.type) {
    case "meal_plan":
      return <MealPlanRenderer section={section} />;
    case "list":
      return <ListRenderer section={section} />;
    case "text":
      return <TextRenderer section={section} />;
    case "table":
      return <TableRenderer section={section} />;
    case "callout":
      return <CalloutRenderer section={section} />;
    default:
      return null;
  }
};

/* ────────────────────────────────────────────────────────────────
   Legacy raw-content parser (fallback when no structured JSON)
──────────────────────────────────────────────────────────────── */

type RawBlock =
  | { kind: "intro"; text: string }
  | { kind: "day"; label: string; meals: { label: string; items: string[] }[] }
  | { kind: "list"; items: string[] }
  | { kind: "note"; items: string[] };

const MEAL_RE =
  /^(Breakfast|Lunch|Dinner|Supper|Snack|Morning snack|Afternoon snack|Evening snack|Pre-workout|Post-workout|Brunch)\s*:/i;
const DAY_RE = /^(Day\s*\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Week\s*\d+)/i;
const NOTE_RE = /^(Note:|Tip:|Important:|Remember:|Drink|Adjust|Good luck|Feel free|This plan|For best results)/i;

const parseRawContent = (raw: string): RawBlock[] => {
  const clean = raw.replace(/#/g, "").replace(/—/g, "–").trim();
  const tokens = clean
    .split(/[\n\r]|(?<!\d)[•·](?!\d)/)
    .map((t) => t.replace(/^\s*[-–]\s/, "").trim())
    .filter(Boolean);

  const blocks: RawBlock[] = [];
  let currentDay: { label: string; meals: { label: string; items: string[] }[] } | null = null;
  let currentMeal: { label: string; items: string[] } | null = null;
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
      if (currentDay) currentDay.meals.push(currentMeal);
      else blocks.push({ kind: "list", items: currentMeal.items });
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
    if (DAY_RE.test(token) && token.length < 60) {
      flushDay(); flushFloating();
      currentDay = { label: token.replace(/:\s*$/, ""), meals: [] };
      continue;
    }
    if (MEAL_RE.test(token)) {
      flushMeal(); flushFloating();
      const colonIdx = token.indexOf(":");
      const label = token.slice(0, colonIdx).trim();
      const rest = token.slice(colonIdx + 1).trim();
      currentMeal = { label, items: rest ? [rest] : [] };
      continue;
    }
    if (NOTE_RE.test(token)) {
      flushDay(); flushFloating();
      noteItems.push(token);
      continue;
    }
    if (!introConsumed && !currentDay && !currentMeal && floatingItems.length === 0 && token.length > 40 && !token.match(/^[\d½¼¾]/)) {
      blocks.push({ kind: "intro", text: token });
      introConsumed = true;
      continue;
    }
    if (currentMeal) currentMeal.items.push(token);
    else floatingItems.push(token);
  }

  flushDay(); flushFloating();
  if (noteItems.length) blocks.push({ kind: "note", items: noteItems });
  return blocks;
};

const RawRenderer = ({ blocks }: { blocks: RawBlock[] }) => {
  const hasDays = blocks.some((b) => b.kind === "day");
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.kind === "intro")
          return (
            <div key={i} className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-5 py-4">
              <p className="text-gray-800 text-sm leading-relaxed">{stripLeadingEmoji(block.text)}</p>
            </div>
          );

        if (block.kind === "day") {
          const dayIndex = blocks.filter((b) => b.kind === "day").indexOf(block) + 1;
          return (
            <div key={i} className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm">{dayIndex}</div>
                <h3 className="text-white font-bold text-sm uppercase tracking-wide">{block.label}</h3>
              </div>
              <div className="p-4 grid sm:grid-cols-2 gap-3 bg-white">
                {block.meals.map((meal, mi) => {
                  const cfg = getMealConfig(meal.label);
                  return (
                    <div key={mi} className={cn("rounded-xl border p-3.5", cfg.border, cfg.bg)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn("w-6 h-6 rounded-md flex items-center justify-center", cfg.iconBg)} aria-hidden="true">{cfg.icon}</span>
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{meal.label}</span>
                      </div>
                      <ul className="space-y-1">
                        {meal.items.map((item, ii) => (
                          <li key={ii} className="flex items-start gap-1.5 text-xs text-gray-700">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0">●</span>
                            <span dangerouslySetInnerHTML={{ __html: safe(item) }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        if (block.kind === "list")
          return hasDays ? (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span dangerouslySetInnerHTML={{ __html: safe(item) }} />
                </li>
              ))}
            </ul>
          ) : (
            <div key={i} className="grid sm:grid-cols-2 gap-2">
              {block.items.map((item, j) => (
                <div key={j} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-700">
                  <span className="text-emerald-500 flex-shrink-0 font-bold text-xs mt-0.5">{String(j + 1).padStart(2, "0")}</span>
                  <span dangerouslySetInnerHTML={{ __html: safe(item) }} />
                </div>
              ))}
            </div>
          );

        if (block.kind === "note")
          return (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Tips & Notes</span>
              </div>
              {block.items.map((note, j) => (
                <p key={j} className="flex items-start gap-2 text-sm text-amber-900">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span dangerouslySetInnerHTML={{ __html: safe(note) }} />
                </p>
              ))}
            </div>
          );

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
  nutritionReport,
  rawContent,
  gradient = "from-emerald-400 via-green-500 to-teal-600",
  className,
  toolTitle = "Your Own Nutritionist",
}: NutritionistReportCardProps) => {
  const [reportId, setReportId] = useState("--------");
  const [reportDate, setReportDate] = useState("--");

  useEffect(() => {
    setReportId(generateReportId());
    setReportDate(formatReportDate());
  }, []);

  const rawBlocks = React.useMemo(
    () => (!nutritionReport && rawContent ? parseRawContent(rawContent) : null),
    [nutritionReport, rawContent]
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
      <div className={cn("relative overflow-hidden bg-gradient-to-r", gradient)}>
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <span className="text-[160px] font-black text-white tracking-widest rotate-[-20deg]">REPORT</span>
        </div>

        <div className="relative z-10 p-8 pb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em]">Yum-Mi AI Platform</p>
                <p className="text-white font-bold text-lg leading-tight">{toolTitle}</p>
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
              Personalised evidence-based nutrition guidance prepared exclusively for you by Yum-Mi AI.
            </p>
          </div>
        </div>

        <div className="relative z-10 bg-black/15 backdrop-blur-sm px-8 py-3 flex flex-wrap gap-x-8 gap-y-1 text-white/80 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Hash className="h-3 w-3" aria-hidden="true" />Report ID: YM-{reportId}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" aria-hidden="true" />Date: {reportDate}
          </span>
          <span className="flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" aria-hidden="true" />Type: Personalised Nutrition Plan
          </span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="p-8 space-y-8">

        {/* §1 Executive Summary — always first */}
        <ReportSection index={sectionIndex++} title="Executive Summary">
          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl px-6 py-5">
            <p className="text-gray-800 text-base leading-relaxed font-medium">
              {/* Prefer structured summary, fall back to greeting */}
              {nutritionReport
                ? stripLeadingEmoji(nutritionReport.summary)
                : stripLeadingEmoji(response.greeting)}
            </p>
          </div>
        </ReportSection>

        {/* Structured JSON sections (primary path) */}
        {nutritionReport?.sections.map((section) => (
          <ReportSection
            key={section.id}
            index={sectionIndex++}
            title={section.title}
            type={section.type}
          >
            <SectionRenderer section={section} />
          </ReportSection>
        ))}

        {/* Raw text fallback */}
        {!nutritionReport && rawBlocks && rawBlocks.length > 0 && (
          <ReportSection index={sectionIndex++} title="Your Personalised Meal Plan">
            <RawRenderer blocks={rawBlocks} />
          </ReportSection>
        )}

        {/* FriendlyFormatter fallback (last resort) */}
        {!nutritionReport && !rawBlocks?.length && response.mainContent && (
          <ReportSection index={sectionIndex++} title="Nutritional Analysis & Recommendations">
            <div
              dangerouslySetInnerHTML={{ __html: sanitize(response.mainContent) }}
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed prose-headings:text-emerald-800 prose-headings:font-bold prose-ul:space-y-1 prose-li:marker:text-emerald-500 prose-strong:text-emerald-700"
            />
          </ReportSection>
        )}

        {/* Action plan — only from FriendlyFormatter (structured JSON has its own list sections) */}
        {!nutritionReport && response.actionItems.length > 0 && (
          <ReportSection index={sectionIndex++} title="Personalised Action Plan">
            <ol className="space-y-3" role="list">
              {response.actionItems.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors duration-200 group"
                  tabIndex={0}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-500 flex items-center justify-center text-emerald-600 group-hover:text-white font-bold text-sm transition-colors duration-200">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div
                    className="flex-1 text-gray-700 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitize(stripLeadingEmoji(item)) }}
                  />
                  <CheckCircle2 className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 mt-0.5 transition-colors duration-200" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </ReportSection>
        )}

        {/* Next Steps — only from FriendlyFormatter */}
        {!nutritionReport && response.nextSteps && (
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
          <div className="text-3xl mb-2" aria-hidden="true">{response.emoji}</div>
          <p className="text-purple-900 text-base font-semibold leading-relaxed max-w-xl mx-auto">
            {stripLeadingEmoji(response.encouragement)}
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
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
