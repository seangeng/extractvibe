/**
 * Maps hex colors to human-readable names.
 * Uses nearest-neighbor matching against a curated palette.
 */

interface NamedColor {
  name: string;
  hex: string;
  r: number;
  g: number;
  b: number;
}

// Curated palette covering the full spectrum
// Names should be simple and descriptive (not poetic)
const NAMED_COLORS: NamedColor[] = [
  // Whites & near-whites
  { name: "White", hex: "#ffffff", r: 255, g: 255, b: 255 },
  { name: "Snow", hex: "#fffafa", r: 255, g: 250, b: 250 },
  { name: "Ghost White", hex: "#f8f8ff", r: 248, g: 248, b: 255 },
  { name: "Off-White", hex: "#fafafa", r: 250, g: 250, b: 250 },
  { name: "Ivory", hex: "#fffff0", r: 255, g: 255, b: 240 },
  { name: "Linen", hex: "#faf0e6", r: 250, g: 240, b: 230 },
  { name: "Seashell", hex: "#fff5ee", r: 255, g: 245, b: 238 },
  { name: "Mint Cream", hex: "#f5fffa", r: 245, g: 255, b: 250 },
  { name: "Honeydew", hex: "#f0fff0", r: 240, g: 255, b: 240 },
  { name: "Alice Blue", hex: "#f0f8ff", r: 240, g: 248, b: 255 },
  { name: "White Smoke", hex: "#f5f5f5", r: 245, g: 245, b: 245 },
  { name: "Floral White", hex: "#fffaf0", r: 255, g: 250, b: 240 },

  // Grays
  { name: "Gainsboro", hex: "#dcdcdc", r: 220, g: 220, b: 220 },
  { name: "Light Gray", hex: "#d3d3d3", r: 211, g: 211, b: 211 },
  { name: "Silver", hex: "#c0c0c0", r: 192, g: 192, b: 192 },
  { name: "Dark Silver", hex: "#a9a9a9", r: 169, g: 169, b: 169 },
  { name: "Gray", hex: "#808080", r: 128, g: 128, b: 128 },
  { name: "Dim Gray", hex: "#696969", r: 105, g: 105, b: 105 },
  { name: "Dark Gray", hex: "#555555", r: 85, g: 85, b: 85 },
  { name: "Charcoal", hex: "#333333", r: 51, g: 51, b: 51 },
  { name: "Near-Black", hex: "#1a1a1a", r: 26, g: 26, b: 26 },
  { name: "Black", hex: "#000000", r: 0, g: 0, b: 0 },
  { name: "Slate Gray", hex: "#708090", r: 112, g: 128, b: 144 },
  { name: "Dark Slate Gray", hex: "#2f4f4f", r: 47, g: 79, b: 79 },

  // Reds
  { name: "Red", hex: "#ff0000", r: 255, g: 0, b: 0 },
  { name: "Crimson", hex: "#dc143c", r: 220, g: 20, b: 60 },
  { name: "Dark Red", hex: "#8b0000", r: 139, g: 0, b: 0 },
  { name: "Scarlet", hex: "#ff2400", r: 255, g: 36, b: 0 },
  { name: "Firebrick", hex: "#b22222", r: 178, g: 34, b: 34 },
  { name: "Indian Red", hex: "#cd5c5c", r: 205, g: 92, b: 92 },
  { name: "Maroon", hex: "#800000", r: 128, g: 0, b: 0 },
  { name: "Rose", hex: "#ff007f", r: 255, g: 0, b: 127 },
  { name: "Coral", hex: "#ff7f50", r: 255, g: 127, b: 80 },
  { name: "Salmon", hex: "#fa8072", r: 250, g: 128, b: 114 },
  { name: "Light Salmon", hex: "#ffa07a", r: 255, g: 160, b: 122 },
  { name: "Tomato", hex: "#ff6347", r: 255, g: 99, b: 71 },
  { name: "Orange Red", hex: "#ff4500", r: 255, g: 69, b: 0 },

  // Pinks
  { name: "Pink", hex: "#ffc0cb", r: 255, g: 192, b: 203 },
  { name: "Light Pink", hex: "#ffb6c1", r: 255, g: 182, b: 193 },
  { name: "Hot Pink", hex: "#ff69b4", r: 255, g: 105, b: 180 },
  { name: "Deep Pink", hex: "#ff1493", r: 255, g: 20, b: 147 },
  { name: "Misty Rose", hex: "#ffe4e1", r: 255, g: 228, b: 225 },
  { name: "Rosy Brown", hex: "#bc8f8f", r: 188, g: 143, b: 143 },

  // Oranges
  { name: "Orange", hex: "#ff8c00", r: 255, g: 140, b: 0 },
  { name: "Dark Orange", hex: "#cc5500", r: 204, g: 85, b: 0 },
  { name: "Tangerine", hex: "#ff9966", r: 255, g: 153, b: 102 },
  { name: "Peach", hex: "#ffcba4", r: 255, g: 203, b: 164 },
  { name: "Burnt Sienna", hex: "#e97451", r: 233, g: 116, b: 81 },
  { name: "Peru", hex: "#cd853f", r: 205, g: 133, b: 63 },

  // Yellows
  { name: "Yellow", hex: "#ffff00", r: 255, g: 255, b: 0 },
  { name: "Gold", hex: "#ffd700", r: 255, g: 215, b: 0 },
  { name: "Amber", hex: "#ffbf00", r: 255, g: 191, b: 0 },
  { name: "Lemon", hex: "#fff44f", r: 255, g: 244, b: 79 },
  { name: "Cream", hex: "#fffdd0", r: 255, g: 253, b: 208 },
  { name: "Khaki", hex: "#f0e68c", r: 240, g: 230, b: 140 },
  { name: "Dark Khaki", hex: "#bdb76b", r: 189, g: 183, b: 107 },
  { name: "Light Goldenrod", hex: "#fafad2", r: 250, g: 250, b: 210 },
  { name: "Goldenrod", hex: "#daa520", r: 218, g: 165, b: 32 },
  { name: "Dark Goldenrod", hex: "#b8860b", r: 184, g: 134, b: 11 },

  // Greens
  { name: "Green", hex: "#008000", r: 0, g: 128, b: 0 },
  { name: "Lime", hex: "#32cd32", r: 50, g: 205, b: 50 },
  { name: "Bright Green", hex: "#00ff00", r: 0, g: 255, b: 0 },
  { name: "Emerald", hex: "#50c878", r: 80, g: 200, b: 120 },
  { name: "Forest Green", hex: "#228b22", r: 34, g: 139, b: 34 },
  { name: "Dark Green", hex: "#006400", r: 0, g: 100, b: 0 },
  { name: "Olive", hex: "#808000", r: 128, g: 128, b: 0 },
  { name: "Dark Olive", hex: "#556b2f", r: 85, g: 107, b: 47 },
  { name: "Olive Drab", hex: "#6b8e23", r: 107, g: 142, b: 35 },
  { name: "Yellow Green", hex: "#9acd32", r: 154, g: 205, b: 50 },
  { name: "Lawn Green", hex: "#7cfc00", r: 124, g: 252, b: 0 },
  { name: "Chartreuse", hex: "#7fff00", r: 127, g: 255, b: 0 },
  { name: "Sage", hex: "#b2ac88", r: 178, g: 172, b: 136 },
  { name: "Mint", hex: "#98ff98", r: 152, g: 255, b: 152 },
  { name: "Sea Green", hex: "#2e8b57", r: 46, g: 139, b: 87 },
  { name: "Medium Sea Green", hex: "#3cb371", r: 60, g: 179, b: 113 },
  { name: "Spring Green", hex: "#00ff7f", r: 0, g: 255, b: 127 },
  { name: "Medium Aquamarine", hex: "#66cdaa", r: 102, g: 205, b: 170 },
  { name: "Pale Green", hex: "#98fb98", r: 152, g: 251, b: 152 },

  // Teals & Cyans
  { name: "Teal", hex: "#008080", r: 0, g: 128, b: 128 },
  { name: "Dark Cyan", hex: "#008b8b", r: 0, g: 139, b: 139 },
  { name: "Cyan", hex: "#00ffff", r: 0, g: 255, b: 255 },
  { name: "Light Cyan", hex: "#e0ffff", r: 224, g: 255, b: 255 },
  { name: "Cadet Blue", hex: "#5f9ea0", r: 95, g: 158, b: 160 },
  { name: "Turquoise", hex: "#40e0d0", r: 64, g: 224, b: 208 },
  { name: "Dark Turquoise", hex: "#00ced1", r: 0, g: 206, b: 209 },
  { name: "Aquamarine", hex: "#7fffd4", r: 127, g: 255, b: 212 },

  // Blues
  { name: "Blue", hex: "#0000ff", r: 0, g: 0, b: 255 },
  { name: "Sky Blue", hex: "#87ceeb", r: 135, g: 206, b: 235 },
  { name: "Light Sky Blue", hex: "#87cefa", r: 135, g: 206, b: 250 },
  { name: "Deep Sky Blue", hex: "#00bfff", r: 0, g: 191, b: 255 },
  { name: "Dodger Blue", hex: "#1e90ff", r: 30, g: 144, b: 255 },
  { name: "Cornflower Blue", hex: "#6495ed", r: 100, g: 149, b: 237 },
  { name: "Royal Blue", hex: "#4169e1", r: 65, g: 105, b: 225 },
  { name: "Medium Blue", hex: "#0000cd", r: 0, g: 0, b: 205 },
  { name: "Navy", hex: "#000080", r: 0, g: 0, b: 128 },
  { name: "Dark Blue", hex: "#00008b", r: 0, g: 0, b: 139 },
  { name: "Midnight Blue", hex: "#191970", r: 25, g: 25, b: 112 },
  { name: "Cobalt", hex: "#0047ab", r: 0, g: 71, b: 171 },
  { name: "Steel Blue", hex: "#4682b4", r: 70, g: 130, b: 180 },
  { name: "Powder Blue", hex: "#b0e0e6", r: 176, g: 224, b: 230 },
  { name: "Ice Blue", hex: "#d6ecef", r: 214, g: 236, b: 239 },
  { name: "Light Blue", hex: "#add8e6", r: 173, g: 216, b: 230 },

  // Purples
  { name: "Purple", hex: "#800080", r: 128, g: 0, b: 128 },
  { name: "Violet", hex: "#7f00ff", r: 127, g: 0, b: 255 },
  { name: "Dark Violet", hex: "#9400d3", r: 148, g: 0, b: 211 },
  { name: "Blue Violet", hex: "#8a2be2", r: 138, g: 43, b: 226 },
  { name: "Indigo", hex: "#4b0082", r: 75, g: 0, b: 130 },
  { name: "Rebecca Purple", hex: "#663399", r: 102, g: 51, b: 153 },
  { name: "Slate Blue", hex: "#6a5acd", r: 106, g: 90, b: 205 },
  { name: "Medium Purple", hex: "#9370db", r: 147, g: 112, b: 219 },
  { name: "Lavender", hex: "#e6e6fa", r: 230, g: 230, b: 250 },
  { name: "Plum", hex: "#8e4585", r: 142, g: 69, b: 133 },
  { name: "Orchid", hex: "#da70d6", r: 218, g: 112, b: 214 },
  { name: "Magenta", hex: "#ff00ff", r: 255, g: 0, b: 255 },
  { name: "Mauve", hex: "#e0b0ff", r: 224, g: 176, b: 255 },
  { name: "Medium Orchid", hex: "#ba55d3", r: 186, g: 85, b: 211 },
  { name: "Thistle", hex: "#d8bfd8", r: 216, g: 191, b: 216 },

  // Browns
  { name: "Brown", hex: "#8b4513", r: 139, g: 69, b: 19 },
  { name: "Saddle Brown", hex: "#8b4513", r: 139, g: 69, b: 19 },
  { name: "Sienna", hex: "#a0522d", r: 160, g: 82, b: 45 },
  { name: "Chocolate", hex: "#7b3f00", r: 123, g: 63, b: 0 },
  { name: "Tan", hex: "#d2b48c", r: 210, g: 180, b: 140 },
  { name: "Beige", hex: "#f5f5dc", r: 245, g: 245, b: 220 },
  { name: "Wheat", hex: "#f5deb3", r: 245, g: 222, b: 179 },
  { name: "Khaki Brown", hex: "#c3b091", r: 195, g: 176, b: 145 },
  { name: "Sand", hex: "#c2b280", r: 194, g: 178, b: 128 },
  { name: "Burlywood", hex: "#deb887", r: 222, g: 184, b: 135 },
  { name: "Bisque", hex: "#ffe4c4", r: 255, g: 228, b: 196 },
  { name: "Navajo White", hex: "#ffdead", r: 255, g: 222, b: 173 },
  { name: "Blanched Almond", hex: "#ffebcd", r: 255, g: 235, b: 205 },
  { name: "Papaya Whip", hex: "#ffefd5", r: 255, g: 239, b: 213 },
  { name: "Moccasin", hex: "#ffe4b5", r: 255, g: 228, b: 181 },
  { name: "Cornsilk", hex: "#fff8dc", r: 255, g: 248, b: 220 },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  }
  if (clean.length !== 6 && clean.length !== 8) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function colorDistance(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  // Weighted Euclidean distance (human eye is more sensitive to green)
  const rMean = (c1.r + c2.r) / 2;
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
  );
}

/**
 * Get the closest human-readable color name for a hex value.
 */
export function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Unknown";

  let closest = NAMED_COLORS[0];
  let minDist = Infinity;

  for (const named of NAMED_COLORS) {
    const dist = colorDistance(rgb, named);
    if (dist < minDist) {
      minDist = dist;
      closest = named;
    }
  }

  return closest.name;
}
