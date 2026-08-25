export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Wifi } from "lucide-react";
import prismadb from "@/lib/prismadb";
import { Eyebrow } from "@/components/fastbird";
import { getDestination, flagUrl } from "@/constants/destinations";

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const ActivityPage = async () => {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const activities = await prismadb.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Eyebrow>// ACTIVITY</Eyebrow>
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-sand text-green">
            <Wifi className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="font-heading text-h1 font-medium text-ink">My eSIMs</h1>
        </div>
        <p className="text-[15px] text-ink-soft">
          Every eSIM you&apos;ve purchased — destination, plan, and Points spent.
        </p>
      </div>

      {/* Table */}
      {activities.length === 0 ? (
        <div className="space-y-3">
          <p className="font-mono text-sm text-ink-soft">
            No eSIMs purchased yet.
          </p>
          <Link
            href="/products"
            className="inline-flex font-mono text-xs uppercase tracking-[0.06em] text-green underline-offset-4 hover:underline fb-focus"
          >
            Browse destinations →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-line bg-surface-card shadow-fb-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-sand">
                <tr>
                  {["Destination", "Plan", "Validity", "Points", "Purchase Date"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-6 py-3.5 text-left font-mono text-xs uppercase tracking-[0.06em] text-ink-soft first:pl-6 last:pr-6"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface-card">
                {activities.map((activity) => {
                  const destination = getDestination(activity.destinationSlug);
                  return (
                    <tr
                      key={activity.id}
                      className="transition-colors hover:bg-sand/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="flex items-center gap-3">
                          {destination && (
                            <span className="relative h-6 w-8 shrink-0 overflow-hidden rounded-sm ring-1 ring-line">
                              <Image
                                src={flagUrl(destination.code, 80)}
                                alt={`${activity.destination} flag`}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            </span>
                          )}
                          <span className="font-sans text-sm font-medium text-ink">
                            {activity.destination}
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-ink">
                        {activity.planData}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-ink-soft">
                        {activity.validityDays} days
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-ink">
                        {activity.points}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-ink-soft">
                        {formatDate(activity.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
