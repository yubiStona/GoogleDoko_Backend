export const CATEGORY_ALLOWED_UNITS: Record<string, string[]> = {
  Furniture: ["piece", "set", "pair"],
  "Home & Living": ["piece", "set", "pair", "pack", "roll"],
  "Kitchen & Dining": ["piece", "set", "pair", "pack"],
  "Fashion & Accessories": ["piece", "pair", "set"],
  Clothing: ["piece"],
  Shoes: ["pair", "piece"],
  "Beauty & Personal Care": ["piece", "pack", "set", "ml", "gram"],
  "Garden & Outdoor": ["piece", "set", "pack", "kg"],
  Fruits: ["kg", "gram", "piece", "pack", "dozen"],
  Vegetables: ["kg", "gram", "piece", "pack", "bunch"],
  Grains: ["kg", "gram", "pack", "bag"],
  Spices: ["gram", "kg", "pack", "jar"],
  "Dairy & Eggs": ["litre", "ml", "dozen", "piece", "pack"],
  Honey: ["jar", "kg", "gram", "bottle"],
  "Organic Fruits": ["kg", "gram", "piece", "pack", "dozen"],
  "Fresh Vegetables": ["kg", "gram", "piece", "pack", "bunch"],
  "Local Grains & Rice": ["kg", "gram", "pack", "bag"],
  "Traditional Spices & Herbs": ["gram", "kg", "pack", "bunch"],
  "Himalayan Tea & Coffee": ["gram", "kg", "pack", "box"],
  "Honey & Preserves": ["jar", "kg", "bottle", "pack"],
  "Bakery & Sweets": ["piece", "box", "pack", "gram"],
  Others: [
    "piece",
    "set",
    "pair",
    "pack",
    "box",
    "kg",
    "gram",
    "litre",
    "ml",
    "dozen",
    "bunch",
    "metre",
  ],
};

const MEASURABLE_UNITS = new Set(["kg", "gram", "litre", "ml", "metre"]);

export function getAllowedUnitsForCategory(category?: string): string[] {
  if (!category) return CATEGORY_ALLOWED_UNITS["Others"];
  const cat = category.trim().toLowerCase();

  for (const [key, units] of Object.entries(CATEGORY_ALLOWED_UNITS)) {
    if (key.toLowerCase() === cat) return units;
  }

  if (cat.includes("furniture")) return CATEGORY_ALLOWED_UNITS["Furniture"];
  if (cat.includes("home") || cat.includes("living")) return CATEGORY_ALLOWED_UNITS["Home & Living"];
  if (cat.includes("kitchen") || cat.includes("dining")) return CATEGORY_ALLOWED_UNITS["Kitchen & Dining"];
  if (cat.includes("cloth") || cat.includes("fashion")) return CATEGORY_ALLOWED_UNITS["Fashion & Accessories"];
  if (cat.includes("shoe")) return CATEGORY_ALLOWED_UNITS["Shoes"];
  if (cat.includes("beauty") || cat.includes("personal")) return CATEGORY_ALLOWED_UNITS["Beauty & Personal Care"];
  if (cat.includes("garden") || cat.includes("outdoor")) return CATEGORY_ALLOWED_UNITS["Garden & Outdoor"];
  if (cat.includes("fruit")) return CATEGORY_ALLOWED_UNITS["Fruits"];
  if (cat.includes("veg")) return CATEGORY_ALLOWED_UNITS["Vegetables"];
  if (cat.includes("grain") || cat.includes("rice")) return CATEGORY_ALLOWED_UNITS["Grains"];
  if (cat.includes("spice") || cat.includes("herb")) return CATEGORY_ALLOWED_UNITS["Spices"];
  if (cat.includes("dairy") || cat.includes("egg") || cat.includes("milk")) return CATEGORY_ALLOWED_UNITS["Dairy & Eggs"];
  if (cat.includes("honey")) return CATEGORY_ALLOWED_UNITS["Honey"];

  return CATEGORY_ALLOWED_UNITS["Others"];
}

export function isUnitAllowedForCategory(category: string, unit: string): boolean {
  if (!unit) return false;
  const allowed = getAllowedUnitsForCategory(category);
  return allowed.map((u) => u.toLowerCase()).includes(unit.trim().toLowerCase());
}

export function isDecimalAllowedForUnit(unit?: string): boolean {
  if (!unit) return false;
  return MEASURABLE_UNITS.has(unit.trim().toLowerCase());
}

export function resolveSellingUnit(category: string, unit?: string, weight?: string): {
  sellingUnit: string;
  allowDecimals: number;
} {
  const allowed = getAllowedUnitsForCategory(category);
  let resolved = unit ? unit.trim().toLowerCase() : "";

  if (!resolved && weight) {
    const w = weight.toLowerCase();
    if (w.includes("dozen")) resolved = "dozen";
    else if (w.includes("bunch")) resolved = "bunch";
    else if (w.includes("litre") || (w.includes("l") && !w.includes("ml") && !w.includes("set"))) resolved = "litre";
    else if (w.includes("kg")) resolved = "kg";
    else if (w.includes("gram") || w.includes("g")) resolved = "gram";
    else if (w.includes("pair")) resolved = "pair";
    else if (w.includes("set")) resolved = "set";
    else if (w.includes("pack")) resolved = "pack";
  }

  if (!resolved || !allowed.map((u) => u.toLowerCase()).includes(resolved)) {
    resolved = allowed[0] || "piece";
  }

  const allowDecimals = isDecimalAllowedForUnit(resolved) ? 1 : 0;
  return { sellingUnit: resolved, allowDecimals };
}
