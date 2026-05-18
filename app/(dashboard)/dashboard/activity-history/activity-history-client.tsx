"use client";

import { useState } from "react";
import { Crown, Activity, Target, Zap, Clock, Filter } from "lucide-react";
import type { ActivityLog } from "@prisma/client";
import type { fetchActivityStats } from "@/lib/activity-log";

type Stats = Awaited<ReturnType<typeof fetchActivityStats>>;

const TOOL_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; gradient: string; label: string }
> = {
  "master-chef": {
    icon: Crown,
    gradient: "from-amber-400 via-orange-500 to-red-600",
    label: "Your Own Chef",
  },
  "master-nutritionist": {
    icon: Activity,
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    label: "Your Own Nutritionist",
  },
  "cal-tracker": {
    icon: Target,
    gradient: "from-blue-400 via-cyan-500 to-indigo-600",
    label: "Your Own Tracker",
  },
};

const ACTION_LABELS: Record<string, string> = {
  recipe_generate: "Recipe Generated",
  nutrition_analyze: "Nutrition Analyzed",
  cal_track: "Calories Tracked",
  meal_plan: "Meal Planned",
};

type FilterType = "all" | "master-chef" | "master-nutritionist" | "cal-tracker";

const FONT_STYLE = {
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: 1.2,
  letterSpacing: "0.01em",
  color: "#0f172a",
} as const;

export default function ActivityHistoryClient({
  logs,
  stats,
}: {
  logs: ActivityLog[];
  stats: Stats;
}) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all" ? logs : logs.filter((l) => l.toolId === filter);

  const statCards = [
    {
      label: "Total Requests",
      value: stats.totalRequests,
      icon: Zap,
      gradient: "from-violet-400 via-purple-500 to-indigo-600",
    },
    {
      label: "Tokens Used",
      value: stats.totalTokensUsed,
      icon: Activity,
      gradient: "from-amber-400 via-orange-500 to-red-500",
    },
    ...stats.byTool.map((t) => ({
      label: t.toolName,
      value: `${t.requests} req · ${t.tokensUsed} tok`,
      icon: TOOL_CONFIG[t.toolId]?.icon ?? Zap,
      gradient: TOOL_CONFIG[t.toolId]?.gradient ?? "from-gray-400 to-gray-600",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-3"
          >
            <div
              className={`bg-gradient-to-r ${card.gradient} p-2.5 rounded-full shrink-0`}
            >
              <card.icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{card.label}</p>
              <p className="font-bold text-gray-900 text-sm truncate">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        {(["all", "master-chef", "master-nutritionist", "cal-tracker"] as FilterType[]).map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-label={`Filter by ${f}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filter === f
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
              }`}
              style={{ fontFamily: FONT_STYLE.fontFamily }}
            >
              {f === "all"
                ? "All Tools"
                : TOOL_CONFIG[f]?.label ?? f}
            </button>
          )
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p style={FONT_STYLE}>No activity yet — start using the tools!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="-my-2 overflow-x-auto">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {["Date", "Tool", "Action", "Tokens Used"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="py-3.5 px-3 text-left first:pl-4 first:sm:pl-0"
                        style={FONT_STYLE}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log) => {
                    const tool = TOOL_CONFIG[log.toolId];
                    const ToolIcon = tool?.icon ?? Zap;
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td
                          className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-0"
                          style={FONT_STYLE}
                        >
                          {new Intl.DateTimeFormat("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(log.createdAt))}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`bg-gradient-to-r ${tool?.gradient ?? "from-gray-400 to-gray-600"} p-1.5 rounded-full`}
                            >
                              <ToolIcon className="w-3 h-3 text-white" />
                            </div>
                            <span style={FONT_STYLE}>{log.toolName}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4" style={FONT_STYLE}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold"
                          >
                            <Zap className="w-3 h-3" />
                            {log.tokensUsed}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
