/**
 * Typed schema for the structured JSON returned by the N8N master-nutritionist webhook.
 *
 * Example wire format:
 * {
 *   "summary": "Here is your personalised 7-day plan...",
 *   "sections": [
 *     { "id": "s1", "title": "Weekly Meal Plan", "type": "meal_plan", "intro": "...", "days": [...] },
 *     { "id": "s2", "title": "Key Tips",          "type": "list",      "items": ["Drink 2L water", ...] },
 *     { "id": "s3", "title": "About This Plan",   "type": "text",      "content": "..." },
 *     { "id": "s4", "title": "Macros Overview",   "type": "table",     "headers": [...], "rows": [[...]] },
 *     { "id": "s5", "title": "Important Note",    "type": "callout",   "content": "...", "variant": "warning" }
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

/**
 * Attempt to parse a raw string from N8N into a NutritionReport.
 * Returns null if the string is not valid JSON or does not match the schema.
 */
export const parseNutritionReport = (raw: string): NutritionReport | null => {
  try {
    const parsed = JSON.parse(raw);

    // Direct format: { summary, sections }
    if (isNutritionReport(parsed)) return parsed;

    // Wrapped object: { output: { summary, sections } }
    if (isNutritionReport(parsed?.output)) return parsed.output as NutritionReport;

    // Double-encoded: { output: "{\"summary\":...,\"sections\":[...]}" }
    // N8N returns output as a JSON string — parse it a second time
    if (typeof parsed?.output === "string") {
      const inner = JSON.parse(parsed.output);
      if (isNutritionReport(inner)) return inner;
    }

    // Wrapped: { response: { summary, sections } }
    if (isNutritionReport(parsed?.response)) return parsed.response as NutritionReport;

    // Double-encoded via response key
    if (typeof parsed?.response === "string") {
      const inner = JSON.parse(parsed.response);
      if (isNutritionReport(inner)) return inner;
    }

    return null;
  } catch {
    return null;
  }
};

const isNutritionReport = (v: unknown): v is NutritionReport =>
  !!v &&
  typeof v === "object" &&
  typeof (v as NutritionReport).summary === "string" &&
  Array.isArray((v as NutritionReport).sections);
