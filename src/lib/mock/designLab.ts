/** Sample content for the Design Lab page (visual styling and presentation). */

export interface Material {
  id: string;
  name: string;
  /** Flat swatch colour used for the preview tile. */
  swatch: string;
  pattern: "brick" | "concrete" | "wood" | "stone" | "glass" | "greenery";
  finish: string;
  cost: "Low" | "Medium" | "High";
}

export const materials: Material[] = [
  { id: "m-brick", name: "Exposed Brick", swatch: "#b5563b", pattern: "brick", finish: "Textured", cost: "Medium" },
  { id: "m-concrete", name: "Concrete", swatch: "#b6bcc6", pattern: "concrete", finish: "Board-formed", cost: "Low" },
  { id: "m-wood", name: "Wood", swatch: "#c48a4a", pattern: "wood", finish: "Vertical slats", cost: "High" },
  { id: "m-stone", name: "Stone", swatch: "#a9a39a", pattern: "stone", finish: "Honed", cost: "High" },
  { id: "m-glass", name: "Glass", swatch: "#9fc3e8", pattern: "glass", finish: "Low-E curtain wall", cost: "High" },
  { id: "m-greenery", name: "Greenery", swatch: "#5f9d4e", pattern: "greenery", finish: "Living wall", cost: "Medium" },
];

export interface LightingSetup {
  id: string;
  name: string;
  recommended?: boolean;
  description: string;
  sky: string;
  ambient: string;
}

export const lightingSetups: LightingSetup[] = [
  { id: "day", name: "Day", description: "Neutral daylight, 5500 K", sky: "#dfeafc", ambient: "#ffffff" },
  { id: "evening", name: "Evening", recommended: true, description: "Warm low sun, 3200 K", sky: "#f5d9b8", ambient: "#ffe8c4" },
  { id: "night", name: "Night", description: "Artificial lighting only", sky: "#1b2440", ambient: "#ffd89a" },
  { id: "indoor", name: "Indoor", description: "Interior perspective", sky: "#eef1f6", ambient: "#fff6e3" },
];

export interface DesignVariation {
  id: string;
  name: string;
  subtitle: string;
  materialIds: string[];
  glazing: number; // 0-100 % of facade
}

export const designVariations: DesignVariation[] = [
  { id: "var-a", name: "Variation A", subtitle: "Open & Green", materialIds: ["m-brick", "m-glass", "m-greenery"], glazing: 55 },
  { id: "var-b", name: "Variation B", subtitle: "Compact & Efficient", materialIds: ["m-concrete", "m-wood"], glazing: 35 },
  { id: "var-c", name: "Variation C", subtitle: "More Circulation", materialIds: ["m-stone", "m-glass", "m-wood"], glazing: 45 },
];

export const designLabStats = {
  variations: 12,
  materials: 48,
  renders: 8,
  lightingSetups: 4,
};
