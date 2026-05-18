"use client";

import { useState } from "react";
import { Crown, Activity, Target, Zap, Clock, Image as ImageIcon, ChevronDown, ChevronUp, Flame } from "lucide-react";

// Serialized log — dates as ISO strings, metadata as plain object
export type SerializedLog = {
  id: string;
  tokensUsed: number;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type SerializedStats = {
  totalRequests: number;
  totalTokensUsed: number;
  byTool: { toolId: string; toolName: string; requests: number; tokensUsed: number }[];
};

type Stats = SerializedStats;
type TabId = "chef" | "nutritionist" | "tracker";

const FONT = {
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: 1.2,
  letterSpacing: "0.01em",
  color: "#0f172a",
} as const;

const TABS = [
  {
    id: "chef" as TabId,
    label: "Your Own Chef",
    icon: Crown,
    gradient: "from-amber-400 via-orange-500 to-red-600",
    bgLight: "bg-amber-50",
    border: "border-amber-200",
    textColor: "text-amber-700",
  },
  {
    id: "nutritionist" as TabId,
    label: "Your Own Nutritionist",
    icon: Activity,
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    bgLight: "bg-emerald-50",
    border: "border-emerald-200",
    textColor: "text-emerald-700",
  },
  {
    id: "tracker" as TabId,
    label: "Your Own Tracker",
    icon: Target,
    gradient: "from-blue-400 via-cyan-500 to-indigo-600",
    bgLight: "bg-blue-50",
    border: "border-blue-200",
    textColor: "text-blue-700",
  },
] as const;

const TOOL_STAT_MAP: Record<string, TabId> = {
  "master-chef": "chef",
  "master-nutritionist": "nutritionist",
  "cal-tracker": "tracker",
};

type ChefMeta = {
  recipeName?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  prompt?: string;
  recipeText?: string;
  hasImage?: boolean;
  fileName?: string;
};

type NutritionistMeta = {
  dishName?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  prompt?: string;
  analysisText?: string;
  hasImage?: boolean;
  fileName?: string;
};

type TrackerMeta = {
  dishName?: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  prompt?: string;
  reportText?: string;
  hasImage?: boolean;
  fileName?: string;
};

const parseMeta = <T,>(raw: unknown): T =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as T) : ({} as T);

// Guard: prompt stored in old records may be an object { role, content, ... }
const safePrompt = (p: unknown): string => {
  if (typeof p === "string") return p;
  if (p && typeof p === "object") {
    const o = p as Record<string, unknown>;
    if (typeof o.content === "string") return o.content;
    if (typeof o.text === "string") return o.text;
  }
  return "";
};

const fmt = (d: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));

// ── Macro badge ──────────────────────────────────────────────────────────────
const MacroBadge = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
    {label} {value}g
  </span>
);

// ── Expandable recipe row ────────────────────────────────────────────────────
function ExpandableRow({
  date,
  title,
  titleFallback,
  kcal,
  protein,
  fat,
  carbs,
  bodyText,
  prompt,
  tokensUsed,
  hasImage,
  fileName,
  tab,
}: {
  date: string;
  title?: string;
  titleFallback: string;
  kcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  bodyText?: string;
  prompt?: string;
  tokensUsed: number;
  hasImage?: boolean;
  fileName?: string;
  tab: (typeof TABS)[number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {/* Date */}
        <td className="whitespace-nowrap py-4 pl-4 pr-3 align-top" style={{ ...FONT, minWidth: 130 }}>
          {fmt(date)}
        </td>

        {/* Dish / Name */}
        <td className="px-3 py-4 align-top" style={{ minWidth: 160 }}>
          <p className="font-semibold text-gray-900 text-sm">
            {title || titleFallback}
          </p>
          {prompt && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {safePrompt(prompt)}
            </p>
          )}
        </td>

        {/* Macros */}
        <td className="px-3 py-4 align-top">
          <div className="flex flex-wrap gap-1">
            {kcal !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-50 border border-orange-200 text-orange-700">
                <Flame className="w-3 h-3" /> {kcal} kcal
              </span>
            )}
            {protein !== undefined && (
              <MacroBadge label="P" value={protein} color="bg-blue-50 border-blue-200 text-blue-700" />
            )}
            {fat !== undefined && (
              <MacroBadge label="F" value={fat} color="bg-yellow-50 border-yellow-200 text-yellow-700" />
            )}
            {carbs !== undefined && (
              <MacroBadge label="C" value={carbs} color="bg-green-50 border-green-200 text-green-700" />
            )}
            {kcal === undefined && protein === undefined && (
              <span className="text-gray-400 text-xs">—</span>
            )}
          </div>
        </td>

        {/* Tokens */}
        <td className="whitespace-nowrap px-3 py-4 align-top">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tab.bgLight} ${tab.border} border ${tab.textColor}`}
          >
            <Zap className="w-3 h-3" />
            {tokensUsed}
          </span>
        </td>

        {/* Image / Expand */}
        <td className="px-3 py-4 align-top text-center">
          <div className="flex items-center justify-center gap-2">
            {hasImage && (
              <span title={fileName ?? "image"}>
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </span>
            )}
            {bodyText && (
              open
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </td>
      </tr>

      {/* Expanded recipe / analysis text */}
      {open && bodyText && (
        <tr>
          <td colSpan={5} className="px-4 pb-4 bg-gray-50">
            <div
              className={`rounded-xl border ${tab.border} ${tab.bgLight} p-4 text-sm text-gray-700 whitespace-pre-wrap`}
              style={{ fontFamily: FONT.fontFamily, lineHeight: 1.7 }}
            >
              {bodyText}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Chef table ───────────────────────────────────────────────────────────────
function ChefTable({ logs, tab }: { logs: SerializedLog[]; tab: (typeof TABS)[number] }) {
  if (logs.length === 0) return <EmptyState label="No Chef requests yet — try generating a recipe!" />;
  return (
    <TableShell>
      {logs.map((log) => {
        const m = parseMeta<ChefMeta>(log.metadata);
        return (
          <ExpandableRow
            key={log.id}
            date={log.createdAt}
            title={m.recipeName}
            titleFallback="Recipe"
            kcal={m.kcal}
            protein={m.protein}
            fat={m.fat}
            carbs={m.carbs}
            bodyText={m.recipeText}
            prompt={m.prompt}
            tokensUsed={log.tokensUsed}
            hasImage={m.hasImage}
            fileName={m.fileName}
            tab={tab}
          />
        );
      })}
    </TableShell>
  );
}

// ── Nutritionist table ───────────────────────────────────────────────────────
function NutritionistTable({ logs, tab }: { logs: SerializedLog[]; tab: (typeof TABS)[number] }) {
  if (logs.length === 0) return <EmptyState label="No Nutritionist requests yet — try a nutrition analysis!" />;
  return (
    <TableShell>
      {logs.map((log) => {
        const m = parseMeta<NutritionistMeta>(log.metadata);
        return (
          <ExpandableRow
            key={log.id}
            date={log.createdAt}
            title={m.dishName}
            titleFallback="Nutrition Analysis"
            kcal={m.kcal}
            protein={m.protein}
            fat={m.fat}
            carbs={m.carbs}
            bodyText={m.analysisText}
            prompt={m.prompt}
            tokensUsed={log.tokensUsed}
            hasImage={m.hasImage}
            fileName={m.fileName}
            tab={tab}
          />
        );
      })}
    </TableShell>
  );
}

// ── Tracker table ────────────────────────────────────────────────────────────
function TrackerTable({ logs, tab }: { logs: SerializedLog[]; tab: (typeof TABS)[number] }) {
  if (logs.length === 0) return <EmptyState label="No Tracker requests yet — start tracking your meals!" />;
  return (
    <TableShell>
      {logs.map((log) => {
        const m = parseMeta<TrackerMeta>(log.metadata);
        return (
          <ExpandableRow
            key={log.id}
            date={log.createdAt}
            title={m.dishName}
            titleFallback="Meal Tracked"
            kcal={m.kcal}
            protein={m.protein}
            fat={m.fat}
            carbs={m.carbs}
            bodyText={m.reportText}
            prompt={m.prompt}
            tokensUsed={log.tokensUsed}
            hasImage={m.hasImage}
            fileName={m.fileName}
            tab={tab}
          />
        );
      })}
    </TableShell>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {["Date", "Dish / Request", "Nutrition", "Tokens", ""].map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="py-3.5 px-3 text-left first:pl-4"
                  style={FONT}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p style={FONT}>{label}</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ActivityHistoryClient({
  chefLogs,
  nutritionistLogs,
  trackerLogs,
  stats,
}: {
  chefLogs: SerializedLog[];
  nutritionistLogs: SerializedLog[];
  trackerLogs: SerializedLog[];
  stats: Stats;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("chef");

  const countByTab: Record<TabId, number> = {
    chef: chefLogs.length,
    nutritionist: nutritionistLogs.length,
    tracker: trackerLogs.length,
  };

  const tokensByTab: Record<TabId, number> = { chef: 0, nutritionist: 0, tracker: 0 };
  stats.byTool.forEach((t) => {
    const tab = TOOL_STAT_MAP[t.toolId];
    if (tab) tokensByTab[tab] = t.tokensUsed;
  });

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3"
          >
            <div className={`bg-gradient-to-r ${tab.gradient} p-2.5 rounded-full shrink-0`}>
              <tab.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{tab.label}</p>
              <p className="font-bold text-gray-900 text-sm">
                {countByTab[tab.id]} requests · {tokensByTab[tab.id]} tokens
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 flex-wrap border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Show ${tab.label} history`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            style={{ fontFamily: FONT.fontFamily }}
          >
            <div className={`bg-gradient-to-r ${tab.gradient} p-1 rounded-full`}>
              <tab.icon className="w-3 h-3 text-white" />
            </div>
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? "bg-violet-100 text-violet-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {countByTab[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400" style={{ fontFamily: FONT.fontFamily }}>
        Click any row to expand the full response
      </p>

      {activeTab === "chef" && <ChefTable logs={chefLogs} tab={TABS[0]} />}
      {activeTab === "nutritionist" && <NutritionistTable logs={nutritionistLogs} tab={TABS[1]} />}
      {activeTab === "tracker" && <TrackerTable logs={trackerLogs} tab={TABS[2]} />}
    </div>
  );
}
