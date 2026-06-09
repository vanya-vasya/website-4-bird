import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Printer, ChefHat, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

export type Recipe = {
  dish: string;
  kcal: number | null;
  prot: number | null;
  fat: number | null;
  carb: number | null;
  saturated_fat?: number | null;
  trans_fat?: number | null;
  polyunsaturated_fat?: number | null;
  monounsaturated_fat?: number | null;
  cholesterol_mg?: number | null;
  sodium_mg?: number | null;
  dietary_fiber?: number | null;
  sugar?: number | null;
  added_sugars?: number | null;
  sugar_alcohols?: number | null;
  vitamin_d_mcg?: number | null;
  calcium_mg?: number | null;
  iron_mg?: number | null;
  potassium_mg?: number | null;
  vitamin_a_mcg?: number | null;
  vitamin_c_mg?: number | null;
  recipe: string;
};

interface RecipeCardProps {
  data: Recipe;
  gradient?: string;
  className?: string;
}

const fmt = (value: number | null | undefined, unit = ""): string => {
  if (value === null || value === undefined) return "—";
  return `${value}${unit}`;
};

export function RecipeCard({ data, gradient = "from-amber-400 via-orange-500 to-red-600", className }: RecipeCardProps) {
  const primaryMacros = [
    { label: "kcal", value: fmt(data.kcal), color: "text-red-200" },
    { label: "Protein", value: fmt(data.prot, "g"), color: "text-blue-200" },
    { label: "Fat", value: fmt(data.fat, "g"), color: "text-yellow-200" },
    { label: "Carbs", value: fmt(data.carb, "g"), color: "text-green-200" },
  ];

  const fatBreakdown = [
    { label: "Saturated Fat", value: fmt(data.saturated_fat, "g") },
    { label: "Trans Fat", value: fmt(data.trans_fat, "g") },
    { label: "Polyunsaturated", value: fmt(data.polyunsaturated_fat, "g") },
    { label: "Monounsaturated", value: fmt(data.monounsaturated_fat, "g") },
  ];

  const otherNutrients = [
    { label: "Cholesterol", value: fmt(data.cholesterol_mg, "mg") },
    { label: "Sodium", value: fmt(data.sodium_mg, "mg") },
    { label: "Dietary Fiber", value: fmt(data.dietary_fiber, "g") },
    { label: "Sugar", value: fmt(data.sugar, "g") },
    { label: "Added Sugars", value: fmt(data.added_sugars, "g") },
    { label: "Sugar Alcohols", value: fmt(data.sugar_alcohols, "g") },
  ];

  const vitaminsAndMinerals = [
    { label: "Vitamin D", value: fmt(data.vitamin_d_mcg, "mcg") },
    { label: "Calcium", value: fmt(data.calcium_mg, "mg") },
    { label: "Iron", value: fmt(data.iron_mg, "mg") },
    { label: "Potassium", value: fmt(data.potassium_mg, "mg") },
    { label: "Vitamin A", value: fmt(data.vitamin_a_mcg, "mcg") },
    { label: "Vitamin C", value: fmt(data.vitamin_c_mg, "mg") },
  ];

  const hasExtendedNutrition =
    data.saturated_fat !== undefined ||
    data.cholesterol_mg !== undefined ||
    data.vitamin_d_mcg !== undefined;

  const handleCopyRecipe = async () => {
    try {
      await navigator.clipboard.writeText(data.recipe);
      toast.success("Recipe copied to clipboard!");
    } catch {
      toast.error("Failed to copy recipe");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) return;

    const nutritionRows = [
      ...primaryMacros.map((m) => `<tr><td>${m.label}</td><td>${m.value}</td></tr>`),
      ...fatBreakdown.map((m) => `<tr><td style="padding-left:16px">${m.label}</td><td>${m.value}</td></tr>`),
      ...otherNutrients.map((m) => `<tr><td>${m.label}</td><td>${m.value}</td></tr>`),
      ...vitaminsAndMinerals.map((m) => `<tr><td>${m.label}</td><td>${m.value}</td></tr>`),
    ].join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${data.dish} – Recipe</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            td { padding: 4px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            td:last-child { text-align: right; font-weight: 600; }
            .recipe-content { margin-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${data.dish}</h1>
          <table>${nutritionRows}</table>
          <div class="recipe-content">${data.recipe.replace(/\n/g, "<br>")}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl rounded-2xl shadow-xl border-0 bg-white overflow-hidden",
        "transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]",
        className
      )}
    >
      {/* Header with gradient background */}
      <div
        className={cn(
          "p-6 text-white relative overflow-hidden",
          `bg-gradient-to-r ${gradient}`
        )}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <ChefHat className="absolute top-4 right-4 h-16 w-16" />
          <div className="absolute bottom-2 left-4 h-8 w-8 rounded-full bg-white opacity-20" />
          <div className="absolute top-8 left-20 h-4 w-4 rounded-full bg-white opacity-20" />
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 flex-shrink-0" />
            <h1 className="text-3xl font-bold tracking-tight">{data.dish}</h1>
          </div>
          <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
            Your Own Chef Recipe
          </div>
        </div>

        {/* Primary macros strip */}
        <div className="mt-5 flex flex-wrap gap-3 relative z-10">
          {primaryMacros.map((macro) => (
            <div
              key={macro.label}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm font-medium"
            >
              <Activity className="h-4 w-4 opacity-80" />
              <span className="opacity-90">{macro.label}:</span>
              <span className="font-bold text-lg">{macro.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Extended nutrition panel */}
      {hasExtendedNutrition && (
        <div className="px-6 pt-5 pb-2 bg-gray-50 border-b border-gray-100">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            Full Nutrition Facts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1">
            {/* Fats column */}
            <NutritionSection title="🧈 Fats Breakdown" rows={fatBreakdown} />
            {/* Other nutrients column */}
            <NutritionSection title="🌿 Other Nutrients" rows={otherNutrients} />
            {/* Vitamins & Minerals column */}
            <NutritionSection title="💊 Vitamins & Minerals" rows={vitaminsAndMinerals} />
          </div>
        </div>
      )}

      {/* Recipe markdown content */}
      <div className="p-8">
        <div className="prose prose-lg prose-neutral max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-amber-200 pb-2 mb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-amber-600" />
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>
              ),
              ul: ({ children }) => <ul className="space-y-2 my-4">{children}</ul>,
              li: ({ children }) => (
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-amber-700">{children}</strong>
              ),
              em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
              p: ({ children }) => (
                <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-amber-300 pl-4 py-2 bg-amber-50 rounded-r-lg my-4">
                  <div className="text-amber-800 italic">{children}</div>
                </blockquote>
              ),
            }}
          >
            {data.recipe}
          </ReactMarkdown>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-gray-100">
          <button
            onClick={handleCopyRecipe}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "border-2 border-amber-200 text-amber-700 hover:bg-amber-50",
              "transition-all duration-200 hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            )}
          >
            <Copy className="h-4 w-4" />
            Copy Recipe
          </button>

          <button
            onClick={handlePrint}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "border-2 border-gray-200 text-gray-700 hover:bg-gray-50",
              "transition-all duration-200 hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            )}
          >
            <Printer className="h-4 w-4" />
            Print Recipe
          </button>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <ChefHat className="h-4 w-4" />
            <span>Generated by Your Own Chef AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── internal helper ── */

type NutritionRow = { label: string; value: string };

const NutritionSection = ({ title, rows }: { title: string; rows: NutritionRow[] }) => (
  <div className="mb-4">
    <p className="text-xs font-semibold text-gray-500 mb-2">{title}</p>
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between text-sm">
          <span className="text-gray-600">{row.label}</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              row.value === "—" ? "text-gray-300" : "text-gray-800"
            )}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);
