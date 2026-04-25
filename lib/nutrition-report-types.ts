/**
 * Typed schema for the structured JSON returned by the N8N master-nutritionist webhook.
 *
 * N8N actual wire format (array-wrapped, flat day structure):
 * [
 *   {
 *     "output": "{\"summary\":\"...\",\"sections\":[{\"type\":\"meal_plan\",\"days\":[
 *       { \"day\": 1, \"breakfast\": { \"description\": \"...\", \"calories\": 350 }, \"lunch\": {...}, ... }
 *     ]}]}"
 *   }
 * ]
 *
 * Normalised internal format (what components expect):
 * {
 *   "summary": "...",
 *   "sections": [
 *     { "id": "s1", "title": "...", "type": "meal_plan", "days": [
 *       { "day": 1, "meals": [{ "type": "breakfast", "items": ["..."], "calories": 350 }], "totalCalories": 1400 }
 *     ]},
 *     { "id": "s2", "title": "...", "type": "list", "items": ["..."] }
 *   ]
 * }
 */

export interface DayMeal {
  /** e.g. "breakfast" | "lunch" | "dinner" | "snack" | "pre-workout" */
  type: string;
  /** Optional display label override (falls back to capitalised type) */
  label?: string;
  items: string[];
  calories?: number;
}

export interface PlanDay {
  /** "Day 1" | "Monday" | 1 — anything renderable */
  day: string | number;
  label?: string;
  meals: DayMeal[];
  totalCalories?: number;
}

export interface MealPlanSection {
  id: string;
  title: string;
  type: "meal_plan";
  intro?: string;
  days: PlanDay[];
}

export interface ListSection {
  id: string;
  title: string;
  type: "list";
  items: string[];
}

export interface TextSection {
  id: string;
  title: string;
  type: "text";
  content: string;
}

export interface TableSection {
  id: string;
  title: string;
  type: "table";
  headers: string[];
  rows: string[][];
}

export type CalloutVariant = "info" | "warning" | "success" | "tip";

export interface CalloutSection {
  id: string;
  title: string;
  type: "callout";
  content: string;
  variant?: CalloutVariant;
}

export type NutritionSection =
  | MealPlanSection
  | ListSection
  | TextSection
  | TableSection
  | CalloutSection;

export interface NutritionReport {
  summary: string;
  sections: NutritionSection[];
}

/* ─────────────────────────────────────────────────────────────
   Day normalisation
   Converts N8N flat-property days into the meals[] format
───────────────────────────────────────────────────────────── */

const FLAT_MEAL_KEYS = [
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "supper",
  "snack",
  "morning snack",
  "afternoon snack",
  "evening snack",
  "pre-workout",
  "post-workout",
] as const;

type FlatMealKey = (typeof FLAT_MEAL_KEYS)[number];

interface RawFlatMeal {
  description?: string;
  items?: string[];
  calories?: number;
}

const normaliseDays = (rawDays: unknown[]): PlanDay[] =>
  rawDays.map((d) => {
    const day = d as Record<string, unknown>;

    // Already in the expected meals[] format
    if (Array.isArray(day.meals)) {
      return {
        day: day.day as string | number,
        label: day.label as string | undefined,
        totalCalories: day.totalCalories as number | undefined,
        meals: (day.meals as Record<string, unknown>[]).map((m) => ({
          type: (m.type as string) ?? "meal",
          label: m.label as string | undefined,
          items: Array.isArray(m.items)
            ? (m.items as string[])
            : m.description
            ? [m.description as string]
            : [],
          calories: m.calories as number | undefined,
        })),
      };
    }

    // N8N flat format: { day: 1, breakfast: { description, calories }, lunch: {...}, ... }
    const meals: DayMeal[] = [];
    let totalCalories = 0;

    for (const key of FLAT_MEAL_KEYS) {
      const entry = day[key] as RawFlatMeal | undefined;
      if (!entry) continue;
      const items: string[] = Array.isArray(entry.items)
        ? entry.items
        : entry.description
        ? [entry.description]
        : [];
      if (!items.length) continue;
      meals.push({ type: key as string, items, calories: entry.calories });
      totalCalories += entry.calories ?? 0;
    }

    return {
      day: day.day as string | number,
      label: day.label as string | undefined,
      totalCalories: totalCalories || (day.totalCalories as number | undefined),
      meals,
    };
  });

const normaliseReport = (report: NutritionReport): NutritionReport => ({
  ...report,
  sections: report.sections.map((s) => {
    if (s.type === "meal_plan" && Array.isArray(s.days)) {
      return { ...s, days: normaliseDays(s.days) } as MealPlanSection;
    }
    return s;
  }),
});

/* ─────────────────────────────────────────────────────────────
   Parser — handles all N8N wrapping variants
───────────────────────────────────────────────────────────── */

const tryExtract = (value: unknown): NutritionReport | null => {
  if (isNutritionReport(value)) return normaliseReport(value);

  if (typeof value === "string") {
    try {
      const inner = JSON.parse(value);
      if (isNutritionReport(inner)) return normaliseReport(inner);
    } catch {
      // not JSON
    }
  }

  return null;
};

/**
 * Attempt to parse a raw string from N8N into a NutritionReport.
 * Handles all known wrapping variants:
 *   - Direct: { summary, sections }
 *   - Object-wrapped: { output: ... } or { response: ... }
 *   - Array-wrapped: [{ output: ... }]
 *   - Double-encoded strings at any level
 */
export const parseNutritionReport = (raw: string): NutritionReport | null => {
  try {
    const parsed = JSON.parse(raw);

    // Direct
    const direct = tryExtract(parsed);
    if (direct) return direct;

    // Array-wrapped: N8N returns [{ output: "..." }]
    const candidate = Array.isArray(parsed) ? parsed[0] : parsed;

    // { output: ... }
    if (candidate?.output !== undefined) {
      const fromOutput = tryExtract(candidate.output);
      if (fromOutput) return fromOutput;
    }

    // { response: ... }
    if (candidate?.response !== undefined) {
      const fromResponse = tryExtract(candidate.response);
      if (fromResponse) return fromResponse;
    }

    // { message: ... }
    if (candidate?.message !== undefined) {
      const fromMessage = tryExtract(candidate.message);
      if (fromMessage) return fromMessage;
    }

    return null;
  } catch {
    return null;
  }
};

const isNutritionReport = (v: unknown): v is NutritionReport =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  typeof (v as NutritionReport).summary === "string" &&
  Array.isArray((v as NutritionReport).sections);
