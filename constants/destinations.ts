// Seed destination catalog. Structured so a real eSIM provider/API can replace
// this list later. Flags are rendered from flagcdn.com via the ISO 3166-1
// alpha-2 `code`. Prices are stored in Points (1 EUR = 5 Points) per plan tier
// and displayed in EUR. Country pricing derives from the supplier per-GB rate
// × 1.3, increased 1.5× (2026-10-14), rounded to whole Points at every step.
// 1 GB tiers were tripled and 3 GB tiers doubled on 2026-10-14.
// Europe Regional and Asia Regional are priced at 0.5 × Global, and Global
// mirrors the most expensive country (Aruba).
// TODO: replace with the production destination/pricing catalog.

export type Region =
  | "Europe"
  | "Americas"
  | "Asia"
  | "Africa"
  | "Oceania"
  | "Caribbean"
  | "Regional";

export type Plan = {
  id: string;
  data: string; // e.g. "5 GB"
  validityDays: number;
  points: number;
  popular?: boolean;
};

export type Destination = {
  slug: string;
  name: string;
  code: string; // ISO 3166-1 alpha-2, lowercase for flagcdn
  region: Region;
  // Plan prices in Points, one entry per PLAN_TIERS entry (1/3/5/10/20 GB)
  planPoints: number[];
  popular?: boolean;
};

export const regions: Region[] = [
  "Europe",
  "Americas",
  "Asia",
  "Africa",
  "Oceania",
  "Caribbean",
  "Regional",
];

const d = (
  name: string,
  code: string,
  region: Region,
  planPoints: number[],
  popular = false
): Destination => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  code: code.toLowerCase(),
  region,
  planPoints,
  popular,
});

export const destinations: Destination[] = [
  // Europe
  d("United Kingdom", "gb", "Europe", [24, 42, 35, 69, 137], true),
  d("France", "fr", "Europe", [18, 36, 30, 60, 122], true),
  d("Spain", "es", "Europe", [18, 36, 30, 60, 122], true),
  d("Italy", "it", "Europe", [18, 36, 30, 60, 122], true),
  d("Germany", "de", "Europe", [18, 34, 29, 56, 111], true),
  d("Portugal", "pt", "Europe", [24, 48, 39, 78, 156]),
  d("Netherlands", "nl", "Europe", [24, 48, 39, 78, 156]),
  d("Switzerland", "ch", "Europe", [24, 46, 38, 75, 150]),
  d("Greece", "gr", "Europe", [18, 34, 27, 54, 108]),
  d("Ireland", "ie", "Europe", [24, 48, 39, 78, 156]),
  d("Austria", "at", "Europe", [24, 48, 39, 78, 156]),
  d("Poland", "pl", "Europe", [24, 48, 39, 78, 156]),
  d("Sweden", "se", "Europe", [24, 48, 39, 78, 156]),
  d("Norway", "no", "Europe", [24, 48, 39, 78, 156]),
  d("Czechia", "cz", "Europe", [24, 48, 39, 78, 156]),
  d("Croatia", "hr", "Europe", [18, 34, 27, 54, 108]),
  d("Iceland", "is", "Europe", [24, 48, 39, 78, 156]),
  d("Belgium", "be", "Europe", [24, 48, 39, 78, 156]),
  // Americas
  d("United States", "us", "Americas", [18, 34, 27, 53, 105], true),
  d("Canada", "ca", "Americas", [36, 72, 60, 120, 240], true),
  d("Mexico", "mx", "Americas", [36, 72, 60, 120, 240]),
  d("Brazil", "br", "Americas", [24, 48, 39, 78, 156]),
  d("Argentina", "ar", "Americas", [63, 124, 102, 206, 410]),
  d("Chile", "cl", "Americas", [51, 102, 86, 170, 339]),
  d("Colombia", "co", "Americas", [51, 102, 86, 170, 339]),
  d("Peru", "pe", "Americas", [45, 90, 77, 152, 305]),
  d("Costa Rica", "cr", "Americas", [42, 82, 68, 135, 269]),
  // Asia
  d("Japan", "jp", "Asia", [18, 36, 30, 60, 122], true),
  d("Thailand", "th", "Asia", [9, 16, 14, 27, 53], true),
  d("Singapore", "sg", "Asia", [18, 34, 27, 54, 108]),
  d("South Korea", "kr", "Asia", [24, 42, 35, 69, 137]),
  d("Indonesia", "id", "Asia", [24, 42, 36, 71, 143]),
  d("Vietnam", "vn", "Asia", [24, 42, 35, 69, 137]),
  d("Malaysia", "my", "Asia", [33, 66, 54, 110, 219]),
  d("United Arab Emirates", "ae", "Asia", [36, 76, 63, 126, 252], true),
  d("Turkey", "tr", "Asia", [18, 34, 27, 54, 108]),
  d("India", "in", "Asia", [24, 46, 38, 75, 150]),
  d("Philippines", "ph", "Asia", [24, 48, 39, 78, 156]),
  d("China", "cn", "Asia", [18, 36, 30, 60, 122]),
  d("Hong Kong", "hk", "Asia", [27, 52, 42, 86, 170]),
  d("Israel", "il", "Asia", [24, 42, 35, 69, 137]),
  d("Saudi Arabia", "sa", "Asia", [24, 42, 36, 71, 143]),
  d("Sri Lanka", "lk", "Asia", [24, 48, 39, 78, 156]),
  // Africa
  d("Egypt", "eg", "Africa", [51, 96, 81, 161, 323]),
  d("Morocco", "ma", "Africa", [24, 48, 39, 78, 156]),
  d("South Africa", "za", "Africa", [36, 76, 63, 126, 252]),
  d("Kenya", "ke", "Africa", [78, 154, 128, 257, 513]),
  d("Tanzania", "tz", "Africa", [36, 76, 63, 126, 252]),
  d("Tunisia", "tn", "Africa", [36, 76, 63, 126, 252]),
  d("Nigeria", "ng", "Africa", [78, 150, 125, 248, 495]),
  // Oceania
  d("Australia", "au", "Oceania", [18, 34, 29, 56, 111], true),
  d("New Zealand", "nz", "Oceania", [36, 72, 62, 122, 245]),
  d("Fiji", "fj", "Oceania", [51, 102, 86, 170, 339]),
  // Caribbean
  d("Dominican Republic", "do", "Caribbean", [36, 70, 57, 113, 227]),
  d("Jamaica", "jm", "Caribbean", [60, 118, 98, 197, 392]),
  d("Bahamas", "bs", "Caribbean", [63, 130, 107, 213, 428]),
  d("Barbados", "bb", "Caribbean", [63, 130, 107, 213, 428]),
  d("Aruba", "aw", "Caribbean", [105, 210, 174, 348, 696]),
  // Regional bundles
  d("Europe Regional", "eu", "Regional", [53, 105, 87, 174, 348], true),
  d("Asia Regional", "as", "Regional", [53, 105, 87, 174, 348]),
  d("Global", "un", "Regional", [105, 210, 174, 348, 696]),
];

// Plan ladder shared by every destination; prices come from each destination's
// planPoints (Points per tier, 1 EUR = 5 Points).
const PLAN_TIERS = [
  { data: "1 GB", validityDays: 7 },
  { data: "3 GB", validityDays: 15 },
  { data: "5 GB", validityDays: 30, popular: true },
  { data: "10 GB", validityDays: 30 },
  { data: "20 GB", validityDays: 30 },
];

/** Build the plan ladder for a destination. */
export const buildPlans = (dest: Destination): Plan[] =>
  PLAN_TIERS.map((tier, i) => ({
    id: `${dest.slug}-${i}`,
    data: tier.data,
    validityDays: tier.validityDays,
    points: dest.planPoints[i],
    popular: tier.popular,
  }));

export const startingPoints = (dest: Destination): number =>
  Math.min(...buildPlans(dest).map((p) => p.points));

/** Find a plan by its id (format: "<slug>-<tierIndex>") within a destination. */
export const getPlan = (dest: Destination, planId: string): Plan | undefined =>
  buildPlans(dest).find((p) => p.id === planId);

export const flagUrl = (code: string, width = 80): string =>
  `https://flagcdn.com/w${width}/${code}.png`;

export const popularDestinations = destinations.filter((x) => x.popular);

export const getDestination = (slug: string): Destination | undefined =>
  destinations.find((x) => x.slug === slug);