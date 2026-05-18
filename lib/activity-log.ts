import prismadb from "@/lib/prismadb";
import { Prisma } from "@prisma/client";

export type ActivityAction =
  | "recipe_generate"
  | "nutrition_analyze"
  | "cal_track"
  | "meal_plan";

// Your Own Chef
export type ChefMetadata = {
  recipeName?: string;
  cuisine?: string;
  portionSize?: string;
  mainIngredients?: string[];
  estimatedCalories?: number;
  prompt?: string;
  responsePreview?: string;
  hasImage?: boolean;
  fileName?: string;
};

// Your Own Nutritionist
export type NutritionistMetadata = {
  analysisType?: string;
  estimatedCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  prompt?: string;
  responsePreview?: string;
  hasImage?: boolean;
  fileName?: string;
};

// Your Own Tracker
export type TrackerMetadata = {
  mealType?: string;
  totalCalories?: number;
  prompt?: string;
  responsePreview?: string;
  hasImage?: boolean;
  fileName?: string;
};

type ProductMetadata = ChefMetadata | NutritionistMetadata | TrackerMetadata;

export const logActivity = async ({
  userId,
  action,
  toolId,
  toolName,
  tokensUsed,
  metadata,
}: {
  userId: string;
  action: ActivityAction;
  toolId: string;
  toolName: string;
  tokensUsed: number;
  metadata?: ProductMetadata;
}) => {
  try {
    // Write to the master ActivityLog
    const activityLog = await prismadb.activityLog.create({
      data: {
        userId,
        action,
        toolId,
        toolName,
        tokensUsed,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    const metaValue = (metadata ?? {}) as Prisma.InputJsonValue;

    // Write to the product-specific table in parallel
    if (toolId === "master-chef") {
      await prismadb.chefLog.create({
        data: {
          userId,
          activityLogId: activityLog.id,
          tokensUsed,
          metadata: metaValue,
        },
      });
    } else if (toolId === "master-nutritionist") {
      await prismadb.nutritionistLog.create({
        data: {
          userId,
          activityLogId: activityLog.id,
          tokensUsed,
          metadata: metaValue,
        },
      });
    } else if (toolId === "cal-tracker") {
      await prismadb.trackerLog.create({
        data: {
          userId,
          activityLogId: activityLog.id,
          tokensUsed,
          metadata: metaValue,
        },
      });
    }
  } catch (error) {
    // Non-blocking — log error but don't fail the main request
    console.error("[ACTIVITY_LOG] Failed to write activity log:", error);
  }
};

// ── Fetch helpers ────────────────────────────────────────────────────────────

export const fetchActivityLogs = async (userId: string, limit = 50) =>
  prismadb.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const fetchChefLogs = async (userId: string, limit = 50) =>
  prismadb.chefLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const fetchNutritionistLogs = async (userId: string, limit = 50) =>
  prismadb.nutritionistLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const fetchTrackerLogs = async (userId: string, limit = 50) =>
  prismadb.trackerLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

export const fetchActivityStats = async (userId: string) => {
  const [totalLogs, tokensByTool, recentActivity] = await Promise.all([
    prismadb.activityLog.count({ where: { userId } }),

    prismadb.activityLog.groupBy({
      by: ["toolId", "toolName"],
      where: { userId },
      _sum: { tokensUsed: true },
      _count: { id: true },
    }),

    prismadb.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        toolName: true,
        tokensUsed: true,
        createdAt: true,
      },
    }),
  ]);

  const totalTokensUsed = tokensByTool.reduce(
    (sum, t) => sum + (t._sum.tokensUsed ?? 0),
    0
  );

  return {
    totalRequests: totalLogs,
    totalTokensUsed,
    byTool: tokensByTool.map((t) => ({
      toolId: t.toolId,
      toolName: t.toolName,
      requests: t._count.id,
      tokensUsed: t._sum.tokensUsed ?? 0,
    })),
    recentActivity,
  };
};
