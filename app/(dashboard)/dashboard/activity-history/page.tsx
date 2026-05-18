import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import { fetchActivityLogs, fetchActivityStats } from "@/lib/activity-log";
import ActivityHistoryClient from "./activity-history-client";

const ActivityHistoryPage = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [logs, stats] = await Promise.all([
    fetchActivityLogs(userId, 100),
    fetchActivityStats(userId),
  ]);

  return (
    <div className="bg-white">
      <FeatureContainer
        title="Activity History"
        description="All your AI requests in one place — tokens spent, tools used, and usage patterns"
        iconName="History"
        gradient="from-violet-400 via-purple-500 to-indigo-600"
      >
        <div className={contentStyles.base}>
          <ActivityHistoryClient logs={logs} stats={stats} />
        </div>
      </FeatureContainer>
    </div>
  );
};

export default ActivityHistoryPage;
