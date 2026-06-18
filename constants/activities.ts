export type ActivityType = "order" | "topup" | "activation" | "usage";
export type ActivityStatus = "completed" | "active" | "pending";

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  date: string; // ISO
  pointsDelta?: number; // negative = spent, positive = added
  status: ActivityStatus;
};

export const activityTypeLabel: Record<ActivityType, string> = {
  order: "Order",
  topup: "Top-up",
  activation: "Activation",
  usage: "Usage",
};

// Mock feed used by the public explainer and as dashboard seed data.
// TODO: replace with live data from the orders/wallet/provider APIs.
export const mockActivities: Activity[] = [
  {
    id: "a1",
    type: "usage",
    title: "Data usage — Japan",
    detail: "2.1 GB of 5 GB used",
    date: "2026-06-15T09:24:00Z",
    status: "active",
  },
  {
    id: "a2",
    type: "activation",
    title: "eSIM activated — Japan",
    detail: "5 GB · 30 days",
    date: "2026-06-14T22:10:00Z",
    status: "completed",
  },
  {
    id: "a3",
    type: "order",
    title: "Plan purchased — Japan",
    detail: "5 GB · 30 days",
    date: "2026-06-14T22:08:00Z",
    pointsDelta: -1.98,
    status: "completed",
  },
  {
    id: "a4",
    type: "topup",
    title: "Points added",
    detail: "Traveler pack · +5 bonus",
    date: "2026-06-14T21:55:00Z",
    pointsDelta: 65,
    status: "completed",
  },
  {
    id: "a5",
    type: "order",
    title: "Plan purchased — Spain",
    detail: "3 GB · 15 days",
    date: "2026-05-02T14:30:00Z",
    pointsDelta: -1.2,
    status: "completed",
  },
];
