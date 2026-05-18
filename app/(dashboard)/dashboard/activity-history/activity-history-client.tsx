"use client";

import { useState } from "react";
import { Crown, Activity, Target, Zap, Clock, Image as ImageIcon } from "lucide-react";
import type { ChefLog, NutritionistLog, TrackerLog } from "@prisma/client";
import type { fetchActivityStats } from "@/lib/activity-log";

type Stats = Awaited<ReturnType<typeof fetchActivityStats>>;

type TabId = "chef" | "nutritionist" | "tracker";

const FONT_STYLE = {
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: 1.2,
  letterSpacing: "0.01em",
  color: "#0f172a",
} as const;

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgLight: string;
  borderColor: string;
}[] = [
  {
    id: "chef",
    label: "Your Own Chef",
    icon: Crown,
    gradient: "from-amber-400 via-orange-500 to-red-600",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    id: "nutritionist",
    label: "Your Own Nutritionist",
    icon: Activity,
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    id: "tracker",
    label: "Your Own Tracker",
    icon: Target,
    gradient: "from-blue-400 via-cyan-500 to-indigo-600",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
  },
];

const TOOL_STAT_MAP: Record<string, TabId> = {
  "master-chef": "chef",
  "master-nutritionist": "nutritionist",
  "cal-tracker": "tracker",
};

type AnyLog = ChefLog | NutritionistLog | TrackerLog;

type LogMeta = {
  prompt?: string;
  responsePreview?: string;
  hasImage?: boolean;
  fileName?: string;
  recipeName?: string;
  cuisine?: string;
  portionSize?: string;
  estimatedCalories?: number;
  mealType?: string;
  totalCalories?: number;
  analysisType?: string;
};

const parseMeta = (raw: unknown): LogMeta =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as LogMeta) : {};

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));

function LogTable({
  logs,
  tab,
  emptyLabel,
}: {
  logs: AnyLog[];
  tab: (typeof TABS)[number];
  emptyLabel: string;
}) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p style={FONT_STYLE}>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {["Date", "Prompt / Request", "Preview", "Tokens", "Image"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="py-3.5 px-3 text-left first:pl-4 last:text-center"
                  style={FONT_STYLE}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const meta = parseMeta(log.metadata);
              return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td
                    className="whitespace-nowrap py-4 pl-4 pr-3 align-top"
                    style={{ ...FONT_STYLE, minWidth: 130 }}
                  >
                    {formatDate(log.createdAt)}
                  </td>
                  <td
                    className="px-3 py-4 align-top max-w-[200px]"
                    style={{ ...FONT_STYLE, fontWeight: 400 }}
                  >
                    <span className="line-clamp-2 text-gray-700 text-xs">
                      {meta.prompt || "—"}
                    </span>
                  </td>
                  <td
                    className="px-3 py-4 align-top max-w-[280px]"
                    style={{ ...FONT_STYLE, fontWeight: 400 }}
                  >
                    <span className="line-clamp-3 text-gray-500 text-xs">
                      {meta.responsePreview || "—"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 align-top">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${tab.bgLight} ${tab.borderColor} border`}
                      style={{ color: "#4f46e5" }}
                    >
                      <Zap className="w-3 h-3" />
                      {log.tokensUsed}
                    </span>
                  </td>
                  <td className="px-3 py-4 align-top text-center">
                    {meta.hasImage ? (
                      <span title={meta.fileName ?? "image"}>
                        <ImageIcon className="w-4 h-4 text-gray-400 mx-auto" />
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ActivityHistoryClient({
  chefLogs,
  nutritionistLogs,
  trackerLogs,
  stats,
}: {
  chefLogs: ChefLog[];
  nutritionistLogs: NutritionistLog[];
  trackerLogs: TrackerLog[];
  stats: Stats;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("chef");

  const countByTab: Record<TabId, number> = {
    chef: chefLogs.length,
    nutritionist: nutritionistLogs.length,
    tracker: trackerLogs.length,
  };

  const tokensByTab: Record<TabId, number> = {
    chef: 0,
    nutritionist: 0,
    tracker: 0,
  };
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
      <div className="flex gap-2 flex-wrap border-b border-gray-200 pb-0">
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
            style={{ fontFamily: FONT_STYLE.fontFamily }}
          >
            <div
              className={`bg-gradient-to-r ${tab.gradient} p-1 rounded-full`}
            >
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

      {/* Table per tab */}
      {activeTab === "chef" && (
        <LogTable
          logs={chefLogs}
          tab={TABS[0]}
          emptyLabel="No Chef requests yet — try generating a recipe!"
        />
      )}
      {activeTab === "nutritionist" && (
        <LogTable
          logs={nutritionistLogs}
          tab={TABS[1]}
          emptyLabel="No Nutritionist requests yet — try a nutrition analysis!"
        />
      )}
      {activeTab === "tracker" && (
        <LogTable
          logs={trackerLogs}
          tab={TABS[2]}
          emptyLabel="No Tracker requests yet — start tracking your meals!"
        />
      )}
    </div>
  );
}
