// Price charged per Point/token, in the payment currency below.
export const TOKEN_RATE = 0.2;

// Currency used for eSIM payments.
export const PAYMENT_CURRENCY = "EUR";

// Points/tokens per 1 EUR. All user-facing amounts are displayed in EUR;
// balances are still stored and processed internally as Points.
export const POINTS_PER_EUR = 5;

export const eurFromPoints = (points: number): number =>
  points / POINTS_PER_EUR;

export const pointsFromEur = (eur: number): number => eur * POINTS_PER_EUR;

// "60" for 60 points, "0.20" for 1 point — keeps EUR labels clean.
export const formatEurFromPoints = (points: number): string => {
  const eur = eurFromPoints(points);
  return Number.isInteger(eur) ? `${eur}` : eur.toFixed(2);
};