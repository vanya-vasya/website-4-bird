// Seed destination catalog. Structured so a real eSIM provider/API can replace
// this list later. Flags are rendered from flagcdn.com via the ISO 3166-1
// alpha-2 `code`. Pricing is placeholder, expressed in FastBird Points.
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
  base: number; // base Points factor used to derive plans
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
  base: number,
  popular = false
): Destination => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  name,
  code: code.toLowerCase(),
  region,
  base,
  popular,
});

export const destinations: Destination[] = [
  // Europe
  d("United Kingdom", "gb", "Europe", 0.52, true),
  d("France", "fr", "Europe", 0.54, true),
  d("Spain", "es", "Europe", 0.5, true),
  d("Italy", "it", "Europe", 0.55, true),
  d("Germany", "de", "Europe", 0.56, true),
  d("Portugal", "pt", "Europe", 0.49),
  d("Netherlands", "nl", "Europe", 0.57),
  d("Switzerland", "ch", "Europe", 0.72),
  d("Greece", "gr", "Europe", 0.53),
  d("Ireland", "ie", "Europe", 0.6),
  d("Austria", "at", "Europe", 0.58),
  d("Poland", "pl", "Europe", 0.45),
  d("Sweden", "se", "Europe", 0.61),
  d("Norway", "no", "Europe", 0.74),
  d("Czechia", "cz", "Europe", 0.46),
  d("Croatia", "hr", "Europe", 0.48),
  d("Iceland", "is", "Europe", 0.79),
  d("Belgium", "be", "Europe", 0.57),
  // Americas
  d("United States", "us", "Americas", 0.58, true),
  d("Canada", "ca", "Americas", 0.6, true),
  d("Mexico", "mx", "Americas", 0.62),
  d("Brazil", "br", "Americas", 0.66),
  d("Argentina", "ar", "Americas", 0.64),
  d("Chile", "cl", "Americas", 0.63),
  d("Colombia", "co", "Americas", 0.61),
  d("Peru", "pe", "Americas", 0.65),
  d("Costa Rica", "cr", "Americas", 0.7),
  // Asia
  d("Japan", "jp", "Asia", 0.55, true),
  d("Thailand", "th", "Asia", 0.5, true),
  d("Singapore", "sg", "Asia", 0.57),
  d("South Korea", "kr", "Asia", 0.56),
  d("Indonesia", "id", "Asia", 0.52),
  d("Vietnam", "vn", "Asia", 0.48),
  d("Malaysia", "my", "Asia", 0.5),
  d("United Arab Emirates", "ae", "Asia", 0.78, true),
  d("Turkey", "tr", "Asia", 0.51),
  d("India", "in", "Asia", 0.46),
  d("Philippines", "ph", "Asia", 0.53),
  d("China", "cn", "Asia", 0.59),
  d("Hong Kong", "hk", "Asia", 0.58),
  d("Israel", "il", "Asia", 0.7),
  d("Saudi Arabia", "sa", "Asia", 0.76),
  d("Sri Lanka", "lk", "Asia", 0.49),
  // Africa
  d("Egypt", "eg", "Africa", 0.6),
  d("Morocco", "ma", "Africa", 0.62),
  d("South Africa", "za", "Africa", 0.64),
  d("Kenya", "ke", "Africa", 0.66),
  d("Tanzania", "tz", "Africa", 0.68),
  d("Tunisia", "tn", "Africa", 0.61),
  d("Nigeria", "ng", "Africa", 0.67),
  // Oceania
  d("Australia", "au", "Oceania", 0.6, true),
  d("New Zealand", "nz", "Oceania", 0.63),
  d("Fiji", "fj", "Oceania", 0.82),
  // Caribbean
  d("Dominican Republic", "do", "Caribbean", 0.72),
  d("Jamaica", "jm", "Caribbean", 0.78),
  d("Bahamas", "bs", "Caribbean", 0.85),
  d("Barbados", "bb", "Caribbean", 0.86),
  d("Aruba", "aw", "Caribbean", 0.84),
  // Regional bundles
  d("Europe Regional", "eu", "Regional", 0.44, true),
  d("Asia Regional", "as", "Regional", 0.47),
  d("Global", "un", "Regional", 0.95),
];

const round = (n: number) => Math.round(n * 100) / 100;

/** Derive the plan ladder for a destination from its base factor. */
export const buildPlans = (dest: Destination): Plan[] => {
  const tiers = [
    { data: "1 GB", validityDays: 7, mult: 1 },
    { data: "3 GB", validityDays: 15, mult: 2.4 },
    { data: "5 GB", validityDays: 30, mult: 3.6, popular: true },
    { data: "10 GB", validityDays: 30, mult: 6.2 },
    { data: "20 GB", validityDays: 30, mult: 10.5 },
  ];
  return tiers.map((t, i) => ({
    id: `${dest.slug}-${i}`,
    data: t.data,
    validityDays: t.validityDays,
    points: round(dest.base * t.mult),
    popular: t.popular,
  }));
};

export const startingPoints = (dest: Destination): number =>
  round(dest.base);

export const flagUrl = (code: string, width = 80): string =>
  `https://flagcdn.com/w${width}/${code}.png`;

export const popularDestinations = destinations.filter((x) => x.popular);

export const getDestination = (slug: string): Destination | undefined =>
  destinations.find((x) => x.slug === slug);
