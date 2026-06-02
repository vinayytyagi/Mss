/**
 * Pick a fallback SVG icon path for a category by name.
 *
 * The shopping catalog uses `category.image_url` first. When admin hasn't
 * uploaded one, we match keywords in the category name to one of the
 * shipped SVGs under public/categories/. Final fallback is `default.svg`.
 *
 * Keep this list ordered most-specific first — the first hit wins.
 */

const RULES = [
  { test: /bridal\s*jewel/i, file: "bridal-jewelry.svg" },
  { test: /bridal/i, file: "bridal-wear.svg" },
  { test: /groom/i, file: "groom-wear.svg" },
  { test: /jewel|necklace|earring|kundan/i, file: "jewellery.svg" },
  { test: /cosmetic|makeup|beauty|skincare/i, file: "cosmetics.svg" },
  { test: /pooja|puja|samagri|diya|temple|spirit/i, file: "pooja-samagri.svg" },
  { test: /wedding\s*access/i, file: "wedding-accessories.svg" },
  { test: /access|bag|clutch|purse/i, file: "accessories.svg" },
  { test: /footwear|shoe|juti|sandal|heel/i, file: "footwear.svg" },
  { test: /cloth|saree|lehenga|kurta|dress|outfit|wear/i, file: "clothing.svg" },
];

export function categoryIconPath(name) {
  const n = String(name || "").trim();
  if (!n) return "/categories/default.svg";
  for (const { test, file } of RULES) {
    if (test.test(n)) return `/categories/${file}`;
  }
  return "/categories/default.svg";
}
