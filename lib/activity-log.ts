import prismadb from "@/lib/prismadb";

export type ActivityAction =
  | "recipe_generate"
  | "nutrition_analyze"
  | "cal_track"
  | "meal_plan";

export type ActivityMetadata = {
  prompt?: string;
  responseLength?: number;
  hasImage?: boolean;
  fileName?: string;
  [key: string]: unknown;
};

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
  metadata?: ActivityMetadata;
}) => {
  try {
    await prismadb.activityLog.create({
      data: {
        userId,
        action,
        toolId,
        toolName,
        tokensUsed,
        metadata: metadata ?? {},
      },
    });
  } catch (error) {
    // Non-blocking — log error but don't fail the main request
    console.error("[ACTIVITY_LOG] Failed to write activity log:", error);
  }
};

export const fetchActivityLogs = async (userId: string, limit = 50) => {
  return prismadb.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};

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
