// Server-side promo codes for eSIM plan purchases. The code reduces the
// Total (the plan price in Points) by the given percent before the balance
// is debited, so the discount is real, not cosmetic. Lookup is case-insensitive
// and trims whitespace; 0 means "not a valid code".
export const PROMO_CODES: Record<string, number> = {
  PROMO1: 1,
  PROMO2: 2,
  PROMO3: 3,
  PROMO4: 4,
  PROMO5: 5,
  PROMO6: 6,
  PROMO7: 7,
  PROMO8: 8,
  PROMO9: 9,
  PROMO10: 10,
  PROMO11: 11,
  PROMO12: 12,
  PROMO13: 13,
  PROMO14: 14,
  PROMO15: 15,
  PROMO16: 16,
  PROMO17: 17,
  PROMO18: 18,
  PROMO19: 19,
  PROMO20: 20,
};

export const getPromoDiscount = (code: string): number =>
  PROMO_CODES[code.trim().toUpperCase()] ?? 0;

// Points charged after the discount; identical formula on client and server.
export const discountedPoints = (points: number, percent: number): number =>
  Math.round((points * (100 - percent)) / 100);