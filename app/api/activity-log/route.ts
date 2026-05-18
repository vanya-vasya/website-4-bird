import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchActivityLogs, fetchActivityStats } from "@/lib/activity-log";

export async function GET(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "logs";
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

  try {
    if (mode === "stats") {
      const stats = await fetchActivityStats(userId);
      return NextResponse.json(stats);
    }

    const logs = await fetchActivityLogs(userId, limit);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("[ACTIVITY_LOG_API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
