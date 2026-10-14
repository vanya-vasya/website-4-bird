// Seed destination catalog. Structured so a real eSIM provider/API can replace
// this list later. Flags are rendered from flagcdn.com via the ISO 3166-1
// alpha-2 `code`. Prices are stored in Points (1 EUR = 5 Points) per plan tier
// and displayed in EUR. Country pricing derives from the supplier per-GB rate
// × 1.3, rounded to whole Points; the three regional bundles keep flat pricing.
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
  d("United Kingdom", "gb", "Europe", [5, 14, 23, 46, 91], true),
  d("France", "fr", "Europe", [4, 12, 20, 40, 81], true),
  d("Spain", "es", "Europe", [4, 12, 20, 40, 81], true),
  d("Italy", "it", "Europe", [4, 12, 20, 40, 81], true),
  d("Germany", "de", "Europe", [4, 11, 19, 37, 74], true),
  d("Portugal", "pt", "Europe", [5, 16, 26, 52, 104]),
  d("Netherlands", "nl", "Europe", [5, 16, 26, 52, 104]),
  d("Switzerland", "ch", "Europe", [5, 15, 25, 50, 100]),
  d("Greece", "gr", "Europe", [4, 11, 18, 36, 72]),
  d("Ireland", "ie", "Europe", [5, 16, 26, 52, 104]),
  d("Austria", "at", "Europe", [5, 16, 26, 52, 104]),
  d("Poland", "pl", "Europe", [5, 16, 26, 52, 104]),
  d("Sweden", "se", "Europe", [5, 16, 26, 52, 104]),
  d("Norway", "no", "Europe", [5, 16, 26, 52, 104]),
  d("Czechia", "cz", "Europe", [5, 16, 26, 52, 104]),
  d("Croatia", "hr", "Europe", [4, 11, 18, 36, 72]),
  d("Iceland", "is", "Europe", [5, 16, 26, 52, 104]),
  d("Belgium", "be", "Europe", [5, 16, 26, 52, 104]),
  // Americas
  d("United States", "us", "Americas", [4, 11, 18, 35, 70], true),
  d("Canada", "ca", "Americas", [8, 24, 40, 80, 160], true),
  d("Mexico", "mx", "Americas", [8, 24, 40, 80, 160]),
  d("Brazil", "br", "Americas", [5, 16, 26, 52, 104]),
  d("Argentina", "ar", "Americas", [14, 41, 68, 137, 273]),
  d("Chile", "cl", "Americas", [11, 34, 57, 113, 226]),
  d("Colombia", "co", "Americas", [11, 34, 57, 113, 226]),
  d("Peru", "pe", "Americas", [10, 30, 51, 101, 203]),
  d("Costa Rica", "cr", "Americas", [9, 27, 45, 90, 179]),
  // Asia
  d("Japan", "jp", "Asia", [4, 12, 20, 40, 81], true),
  d("Thailand", "th", "Asia", [2, 5, 9, 18, 35], true),
  d("Singapore", "sg", "Asia", [4, 11, 18, 36, 72]),
  d("South Korea", "kr", "Asia", [5, 14, 23, 46, 91]),
  d("Indonesia", "id", "Asia", [5, 14, 24, 47, 95]),
  d("Vietnam", "vn", "Asia", [5, 14, 23, 46, 91]),
  d("Malaysia", "my", "Asia", [7, 22, 36, 73, 146]),
  d("United Arab Emirates", "ae", "Asia", [8, 25, 42, 84, 168], true),
  d("Turkey", "tr", "Asia", [4, 11, 18, 36, 72]),
  d("India", "in", "Asia", [5, 15, 25, 50, 100]),
  d("Philippines", "ph", "Asia", [5, 16, 26, 52, 104]),
  d("China", "cn", "Asia", [4, 12, 20, 40, 81]),
  d("Hong Kong", "hk", "Asia", [6, 17, 28, 57, 113]),
  d("Israel", "il", "Asia", [5, 14, 23, 46, 91]),
  d("Saudi Arabia", "sa", "Asia", [5, 14, 24, 47, 95]),
  d("Sri Lanka", "lk", "Asia", [5, 16, 26, 52, 104]),
  // Africa
  d("Egypt", "eg", "Africa", [11, 32, 54, 107, 215]),
  d("Morocco", "ma", "Africa", [5, 16, 26, 52, 104]),
  d("South Africa", "za", "Africa", [8, 25, 42, 84, 168]),
  d("Kenya", "ke", "Africa", [17, 51, 85, 171, 342]),
  d("Tanzania", "tz", "Africa", [8, 25, 42, 84, 168]),
  d("Tunisia", "tn", "Africa", [8, 25, 42, 84, 168]),
  d("Nigeria", "ng", "Africa", [17, 50, 83, 165, 330]),
  // Oceania
  d("Australia", "au", "Oceania", [4, 11, 19, 37, 74], true),
  d("New Zealand", "nz", "Oceania", [8, 24, 41, 81, 163]),
  d("Fiji", "fj", "Oceania", [11, 34, 57, 113, 226]),
  // Caribbean
  d("Dominican Republic", "do", "Caribbean", [8, 23, 38, 75, 151]),
  d("Jamaica", "jm", "Caribbean", [13, 39, 65, 131, 261]),
  d("Bahamas", "bs", "Caribbean", [14, 43, 71, 142, 285]),
  d("Barbados", "bb", "Caribbean", [14, 43, 71, 142, 285]),
  d("Aruba", "aw", "Caribbean", [23, 70, 116, 232, 464]),
  // Regional bundles
  d("Europe Regional", "eu", "Regional", [20, 30, 60, 100, 200], true),
  d("Asia Regional", "as", "Regional", [20, 30, 60, 100, 200]),
  d("Global", "un", "Regional", [20, 30, 60, 100, 200]),
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