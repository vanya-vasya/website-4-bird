import { ShoppingBag, Wallet, Power, Activity as ActivityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import {
  activityTypeLabel,
  type Activity,
  type ActivityType,
  type ActivityStatus,
} from "@/constants/activities";

const typeIcon: Record<ActivityType, typeof Wallet> = {
  order: ShoppingBag,
  topup: Wallet,
  activation: Power,
  usage: ActivityIcon,
};

const statusVariant: Record<ActivityStatus, "sage" | "gold" | "neutral"> = {
  active: "sage",
  pending: "gold",
  completed: "neutral",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPoints = (delta: number) =>
  `${delta > 0 ? "+" : ""}${delta} Points`;

type ActivityTimelineProps = {
  items: Activity[];
};

export const ActivityTimeline = ({ items }: ActivityTimelineProps) => (
  <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface-card">
    {items.map((item) => {
      const Icon = typeIcon[item.type];
      return (
        <li key={item.id} className="flex items-center gap-4 p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-sand text-green">
            <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-base font-medium text-ink">
                {item.title}
              </p>
              <Badge variant={statusVariant[item.status]}>
                {activityTypeLabel[item.type]}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{item.detail}</p>
            <p className="mt-1 font-mono text-xs text-ink-soft">
              {formatDate(item.date)}
            </p>
          </div>
          {item.pointsDelta !== undefined && (
            <span
              className={cn(
                "shrink-0 font-mono text-sm",
                item.pointsDelta > 0 ? "text-green" : "text-ink"
              )}
            >
              {formatPoints(item.pointsDelta)}
            </span>
          )}
        </li>
      );
    })}
  </ul>
);
