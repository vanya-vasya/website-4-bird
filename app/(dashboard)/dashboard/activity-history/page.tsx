import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import {
  fetchChefLogs,
  fetchNutritionistLogs,
  fetchTrackerLogs,
  fetchActivityStats,
} from "@/lib/activity-log";
import ActivityHistoryClient, {
  type SerializedLog,
  type SerializedStats,
} from "./activity-history-client";

// Serialize Prisma rows — convert Date → ISO string, keep metadata as plain JSON
const serializeLogs = (
  logs: { id: string; userId: string; activityLogId: string | null; tokensUsed: number; metadata: unknown; createdAt: Date }[]
): SerializedLog[] =>
  logs.map((l) => ({
    id: l.id,
    tokensUsed: l.tokensUsed,
    createdAt: l.createdAt.toISOString(),
    metadata: l.metadata as Record<string, unknown> | null,
  }));

const ActivityHistoryPage = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [chefLogs, nutritionistLogs, trackerLogs, rawStats] = await Promise.all([
    fetchChefLogs(userId, 100),
    fetchNutritionistLogs(userId, 100),
    fetchTrackerLogs(userId, 100),
    fetchActivityStats(userId),
  ]);

  // Serialize stats — drop recentActivity (contains Dates, not needed in UI)
  const stats: SerializedStats = {
    totalRequests: rawStats.totalRequests,
    totalTokensUsed: rawStats.totalTokensUsed,
    byTool: rawStats.byTool,
  };

  return (
    <div className="bg-white">
      <FeatureContainer
        title="Activity History"
        description="All your AI requests in one place — tokens spent, tools used, and usage patterns"
        iconName="History"
        gradient="from-violet-400 via-purple-500 to-indigo-600"
      >
        <div className={contentStyles.base}>
          <ActivityHistoryClient
            chefLogs={serializeLogs(chefLogs)}
            nutritionistLogs={serializeLogs(nutritionistLogs)}
            trackerLogs={serializeLogs(trackerLogs)}
            stats={stats}
          />
        </div>
      </FeatureContainer>
    </div>
  );
};

export default ActivityHistoryPage;
