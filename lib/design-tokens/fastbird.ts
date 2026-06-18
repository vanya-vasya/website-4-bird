/**
 * FastBird design tokens — "Make Banking Matter" system.
 * Single source of truth for palette/radius/shadow values used in JS land
 * (charts, QR codes, canvas, inline styles). UI should prefer Tailwind tokens.
 */

export const colors = {
  primary: "#1D4D3A", // Forest — primary brand, dark sections, primary buttons
  green: "#2F7A57", // Secondary green — hovers, secondary surfaces, icons
  sage: "#5FAE87", // Tertiary green — success, subtle highlights, charts
  sand: "#E8E0CF", // Warm neutral — dense-data backgrounds, cards on dark
  accent: "#E0A93F", // Gold — single accent for high-intent actions
  ink: "#14211B", // Primary text on light
  inkSoft: "#4A574F", // Secondary text, captions
  surface: "#FBFAF6", // Default page background
  surfaceCard: "#FFFFFF", // Cards on light
  line: "rgba(20,33,27,0.10)", // Hairline borders
  onDark: "#F4F1E8", // Text on dark backgrounds
} as const;

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  pill: "999px",
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(20,33,27,.06)",
  md: "0 8px 24px rgba(20,33,27,.08)",
} as const;

/** 4-point base spacing scale (px). */
export const space = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128] as const;

export type FastBirdColor = keyof typeof colors;
