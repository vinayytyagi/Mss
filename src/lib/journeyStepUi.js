/**
 * journeyStepUi — per-step UI configuration for the customer journey
 * pages, derived from the Part 1 / Part 2 design mockups.
 *
 * Every journey step renders in one of four page modes:
 *   "listing"  — product-listing grid of vendor items rendered with the
 *                shared ProductCard; add-to-quote drops a PRODUCT line
 *                (venue, decor, shopping, catering, gifting)
 *   "packages" — tier package builder (photography, makeup-and-mehndi):
 *                JourneyPackagesPage renders the admin-defined TiersBuilder
 *                (builder_type "tiers" in journeyMode) — selectable tier cards
 *                + add-ons + detail fields that add a PACKAGE quote-cart line.
 *   "enquiry"  — request-builder form, no item grid
 *                (honeymoon, pagfera, streedhan, wedding-invitation)
 *   "legacy"   — the original generic grid (any new/unconfigured step)
 *
 * Listing/package configs map mockup card fields onto the real item
 * attribute keys defined in mss-admin/src/lib/itemAttributesSchema.js,
 * so no schema/backend change is needed — it's all presentation.
 */

import {
  ShieldCheck,
  CalendarCheck,
  UserCheck,
  Image as ImageIcon,
  Palette,
  Truck,
  Sparkles,
  Package,
  Camera,
  Clock,
  Receipt,
  Home,
} from "lucide-react";

const PACKAGE_SLUGS = new Set(["photography", "makeup-and-mehndi"]);
// SectionsBuilder steps — admin-defined selectable sections + detail
// fields, assembled into a PACKAGE quote line (no item grid).
const SECTIONS_SLUGS = new Set(["wedding-invitation", "streedhan", "pagfera", "honeymoon"]);
// DUAL steps — a product-listing tab + a SectionsBuilder tab.
const DUAL_SLUGS = new Set(["catering", "gifting"]);
// Pure product-listing steps — the shared ProductCard grid.
const LISTING_SLUGS = new Set(["venue", "decor", "shopping"]);

export function getJourneyPageMode(slug) {
  const s = String(slug || "").trim().toLowerCase();
  if (SECTIONS_SLUGS.has(s)) return "sections";
  if (DUAL_SLUGS.has(s)) return "dual";
  if (PACKAGE_SLUGS.has(s)) return "packages";
  if (LISTING_SLUGS.has(s)) return "listing";
  return "legacy";
}

/* ----------------------------- helpers ----------------------------- */

export function formatINR(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function attr(item, key) {
  return item?.attributes?.[key];
}

function numAttr(item, key) {
  const n = Number(attr(item, key));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function strAttr(item, key) {
  const v = attr(item, key);
  return v == null ? "" : String(v).trim();
}

function arrAttr(item, key) {
  const v = attr(item, key);
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

/** yesno booleans, tristate strings ("Yes" / "Optional (extra charges)") → included? */
function isIncluded(v) {
  if (v === true) return true;
  if (typeof v === "string") return /^(yes|optional|included|free)/i.test(v.trim());
  return false;
}

/* --------------------------- trust strips -------------------------- */

const TRUST = {
  venue: [
    { icon: ShieldCheck, label: "All venues verified by MyShaadiStore" },
    { icon: CalendarCheck, label: "We handle booking & advance" },
    { icon: UserCheck, label: "Coordinator on event day" },
  ],
  decor: [
    { icon: ImageIcon, label: "Real past work — no stock photos" },
    { icon: Palette, label: "Custom colours on request" },
    { icon: UserCheck, label: "Coordinator on event day" },
  ],
  catering: [
    { icon: ShieldCheck, label: "All caterers verified by MyShaadi" },
    { icon: Sparkles, label: "500+ events catered" },
    { icon: UserCheck, label: "Coordinator on event day" },
  ],
  gifting: [
    { icon: Truck, label: "Delivered to your door" },
    { icon: Sparkles, label: "Fully personalised" },
    { icon: Package, label: "Bulk orders accepted" },
    { icon: ShieldCheck, label: "Verified vendors only" },
  ],
  photography: [
    { icon: Camera, label: "Candid + traditional both" },
    { icon: Clock, label: "20–30 day delivery" },
    { icon: ShieldCheck, label: "Verified teams only" },
    { icon: Receipt, label: "No hidden fees" },
  ],
  "makeup-and-mehndi": [
    { icon: Home, label: "Home visit options" },
    { icon: Sparkles, label: "Professional products" },
    { icon: UserCheck, label: "Event-day coordination" },
  ],
};

export function getTrustItems(slug) {
  return TRUST[String(slug || "").toLowerCase()] || [];
}

/* ------------------------- listing configs ------------------------- */

const GUEST_BRACKETS = [
  { value: "0-100", label: "Up to 100", lo: null, hi: 100 },
  { value: "100-300", label: "100–300", lo: 100, hi: 300 },
  { value: "300-500", label: "300–500", lo: 300, hi: 500 },
  { value: "500+", label: "500+", lo: 500, hi: null },
];

/**
 * Per-ITEM price-RANGE filter — distinct from the step's TOTAL budget. A decor
 * or shopping buyer spends one budget across many items, so the total-budget
 * chip can't narrow individual products; this lets them filter the grid by a
 * single item's price with a custom min/max range (slider + number inputs).
 * Prices are in rupees (item.price / final_price are stored as rupees, not
 * paise). The filter value is `null` (no range) or `{ min, max }` where either
 * side may be null for an open end; bounds are inclusive.
 *
 * Sensible per-step bounds: decor items run higher (mandaps, stages) than
 * shopping items (outfits, jewellery), so the slider ceiling + step differ.
 */
const PRICE_RANGE_BOUNDS = {
  decor: { max: 500000, step: 1000 },
  shopping: { max: 200000, step: 500 },
};

function priceRangeFilter(stepSlug) {
  const { max, step } = PRICE_RANGE_BOUNDS[stepSlug] || { max: 500000, step: 1000 };
  return {
    key: "price_range",
    label: "Price",
    kind: "price-range",
    min: 0,
    max,
    step,
    match: (item, value) => {
      if (value == null) return true;
      const { min: lo, max: hi } = value;
      const p = Number(item?.final_price ?? item?.price) || 0;
      if (lo != null && p < lo) return false;
      if (hi != null && p > hi) return false;
      return true;
    },
  };
}

const LISTING = {
  venue: {
    filters: [
      {
        key: "venue_type",
        label: "Venue type",
        options: [
          "Banquet Hall", "Lawn", "Resort", "Farmhouse", "Marriage Garden",
          "5-Star Hotel", "4-Star Hotel", "3-Star Hotel", "Heritage Palace",
          "Beach Resort", "Convention Centre", "Destination Venue", "Rooftop",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "venue_type") === v,
      },
      // NOTE: the "Guest capacity" dropdown was removed — it duplicated the
      // signup-driven "Guest size" header chip (both filter item.max_guests).
      // The chip stays the single guest-capacity control on the venue step.
      {
        key: "food_policy",
        label: "Veg / Non-veg",
        options: [
          { value: "Veg Only", label: "Veg only" },
          { value: "Non-Veg Allowed", label: "Non-veg allowed" },
          { value: "Both", label: "Veg + Non-veg" },
        ],
        match: (item, v) => strAttr(item, "veg_non_veg_allowed") === v,
      },
      {
        key: "indoor_outdoor",
        label: "Indoor / Outdoor",
        options: ["Indoor", "Outdoor", "Both"].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "indoor_outdoor") === v,
      },
    ],
    card: {
      badge: (item) => {
        const v = strAttr(item, "veg_non_veg_allowed");
        if (v === "Veg Only") return { label: "Veg only", tone: "success" };
        if (v === "Non-Veg Allowed") return { label: "Non-veg allowed", tone: "warning" };
        if (v === "Both") return { label: "Veg + Non-veg", tone: "info" };
        return null;
      },
      chips: (item) =>
        [
          strAttr(item, "venue_type"),
          numAttr(item, "max_guests") ? `Up to ${numAttr(item, "max_guests")} guests` : null,
          strAttr(item, "ac_non_ac") === "AC" ? "AC" : null,
          numAttr(item, "rooms_available") ? `${numAttr(item, "rooms_available")} rooms` : null,
          numAttr(item, "parking_capacity") ? "Parking" : null,
          strAttr(item, "indoor_outdoor"),
        ].filter(Boolean),
      stats: (item) =>
        [
          numAttr(item, "veg_plate_price")
            ? { label: "Per plate", value: `₹${Number(attr(item, "veg_plate_price")).toLocaleString("en-IN")}/plate` }
            : null,
          numAttr(item, "rental_charges")
            ? { label: "Hall rental", value: `From ${formatINR(attr(item, "rental_charges"))}` }
            : null,
          numAttr(item, "max_guests")
            ? { label: "Capacity", value: `${numAttr(item, "max_guests")} guests` }
            : null,
        ].filter(Boolean),
      priceCaption: "Starting price",
      ctaLabel: "Add to basket",
    },
  },

  decor: {
    filters: [
      {
        key: "decor_type",
        label: "Function / setup",
        options: [
          "Mandap", "Stage", "Entry Gate", "Floral", "Lighting", "Theme Decor",
          "Photobooth", "Centerpieces", "Bridal Room", "Car", "Welcome Setup", "Aisle",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "decor_type") === v,
      },
      {
        key: "theme",
        label: "Theme",
        options: [
          "Floral", "Royal", "Rustic", "Bollywood", "Traditional", "Modern",
          "Boho", "Vintage", "Pastel", "Garden", "Minimalist", "Fairy-tale",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "theme") === v,
      },
      {
        key: "colour",
        label: "Colour palette",
        options: ["Gold", "Red", "Pastel", "Green", "White", "Pink", "Multicolour"].map((v) => ({
          value: v,
          label: v,
        })),
        match: (item, v) =>
          arrAttr(item, "color_themes").some((c) => c.toLowerCase().includes(v.toLowerCase())),
      },
      priceRangeFilter("decor"),
    ],
    card: {
      badge: (item) => {
        const v = strAttr(item, "decor_type");
        return v ? { label: v, tone: "neutral" } : null;
      },
      subtitle: (item) =>
        [strAttr(item, "theme"), arrAttr(item, "color_themes")[0]].filter(Boolean).join(" · "),
      chips: (item) => arrAttr(item, "includes").slice(0, 3),
      stats: () => [],
      pricePrefix: "From ",
      priceCaption: "Starting price",
      ctaLabel: "I want this",
    },
  },

  catering: {
    filters: [
      {
        key: "cuisine",
        label: "Cuisine",
        options: [
          "North Indian", "South Indian", "Chinese", "Mughlai", "Continental",
          "Italian", "Bengali", "Punjabi", "Gujarati", "Rajasthani", "Hyderabadi",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => arrAttr(item, "cuisine_types").includes(v),
      },
      {
        key: "food_type",
        label: "Veg / Non-veg",
        options: ["Veg", "Non-Veg", "Both", "Jain Only", "Vegan", "Sattvik"].map((v) => ({
          value: v,
          label: v,
        })),
        match: (item, v) => strAttr(item, "food_type") === v,
      },
      {
        key: "plates",
        label: "Guest count",
        options: GUEST_BRACKETS.map(({ value, label }) => ({ value, label })),
        match: (item, v) => {
          const b = GUEST_BRACKETS.find((x) => x.value === v);
          if (!b) return true;
          const min = numAttr(item, "min_plates");
          const max = numAttr(item, "max_plates");
          // Caterer fits if their plate range overlaps the chosen band.
          if (min != null && b.hi != null && min > b.hi) return false;
          if (max != null && b.lo != null && max < b.lo) return false;
          return true;
        },
      },
    ],
    card: {
      badge: (item) => {
        const v = strAttr(item, "food_type");
        if (!v) return null;
        if (v === "Veg" || v === "Jain Only" || v === "Vegan" || v === "Sattvik")
          return { label: v === "Veg" ? "Veg only" : v, tone: "success" };
        if (v === "Non-Veg") return { label: "Non-veg", tone: "warning" };
        return { label: "Veg + Non-veg", tone: "info" };
      },
      chips: (item) => {
        const liveCount = arrAttr(item, "live_counters").length;
        return [
          ...arrAttr(item, "cuisine_types").slice(0, 3),
          strAttr(item, "crockery_type"),
          liveCount ? `${liveCount} live counters` : null,
        ].filter(Boolean);
      },
      stats: (item) =>
        [
          numAttr(item, "veg_plate_price")
            ? { label: "Per plate", value: `₹${Number(attr(item, "veg_plate_price")).toLocaleString("en-IN")}+` }
            : null,
          numAttr(item, "min_plates")
            ? { label: "Min guests", value: String(numAttr(item, "min_plates")) }
            : null,
          numAttr(item, "max_plates")
            ? { label: "Max guests", value: String(numAttr(item, "max_plates")) }
            : null,
        ].filter(Boolean),
      pricePrefix: "Starting ",
      priceCaption: "Starting price",
      ctaLabel: "Add to basket",
    },
  },

  gifting: {
    categoryStyle: "tabs",
    filters: [
      {
        key: "gift_type",
        label: "Gift type",
        options: [
          "Sweets Box", "Dry Fruits Hamper", "Pooja Thali", "Hamper", "Return Gift",
          "Chocolate Box", "Silver Article", "Photo Frame", "Customised", "Mixed Hamper",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "gift_type") === v,
      },
      {
        key: "packaging",
        label: "Packaging",
        options: [
          "Box", "Basket", "Velvet Pouch", "Wooden Box", "Gift Bag", "Tray", "Eco-friendly",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "packaging_type") === v,
      },
      {
        key: "qty",
        label: "Quantity",
        options: [
          { value: "1-10", label: "1–10", lo: null, hi: 10 },
          { value: "10-50", label: "10–50", lo: 10, hi: 50 },
          { value: "50-200", label: "50–200", lo: 50, hi: 200 },
          { value: "200+", label: "200+", lo: 200, hi: null },
        ].map(({ value, label }) => ({ value, label })),
        match: (item, v) => {
          // Vendor's minimum order must not exceed the top of the chosen band.
          const hi = { "1-10": 10, "10-50": 50, "50-200": 200, "200+": null }[v];
          const min = numAttr(item, "min_order_qty");
          if (min == null || hi == null) return true;
          return min <= hi;
        },
      },
    ],
    card: {
      badge: (item) => {
        const v = strAttr(item, "gift_type");
        return v ? { label: v, tone: "neutral" } : null;
      },
      chips: (item) =>
        [
          strAttr(item, "packaging_type"),
          ...arrAttr(item, "customisation").filter((c) => c !== "None").slice(0, 2),
          numAttr(item, "min_order_qty") ? `Min ${numAttr(item, "min_order_qty")} qty` : null,
        ].filter(Boolean),
      stats: () => [],
      priceLabel: "Per hamper",
      ctaLabel: "Add to basket",
    },
  },

  shopping: {
    filters: [
      {
        // Reads the canonical item.audience (bride|groom|both) — the single
        // dulha/dulhan source — instead of a duplicate for_gender attribute.
        key: "shop_for",
        label: "Shop for",
        options: [
          { value: "bride", label: "Dulhan" },
          { value: "groom", label: "Dulha" },
        ],
        match: (item, v) => String(item?.audience || "").toLowerCase() === v,
      },
      {
        key: "occasion",
        label: "Occasion",
        options: [
          "Wedding", "Engagement", "Reception", "Sangeet", "Mehendi", "Haldi",
          "Pre-wedding", "Festive", "Cocktail", "Party",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => arrAttr(item, "occasion").includes(v),
      },
      {
        key: "fabric_material",
        label: "Fabric",
        options: [
          "Pure Silk", "Banarasi Silk", "Kanjeevaram Silk", "Chiffon", "Georgette",
          "Net", "Velvet", "Cotton", "Organza", "Satin", "Brocade", "Raw Silk", "Art Silk",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => strAttr(item, "fabric_material") === v,
      },
      {
        key: "work_embroidery",
        label: "Work",
        options: [
          "Zari", "Zardozi", "Sequins", "Mirror", "Thread", "Pearl", "Stone",
          "Resham", "Gota Patti", "Chikan", "Plain",
        ].map((v) => ({ value: v, label: v })),
        match: (item, v) => arrAttr(item, "work_embroidery").includes(v),
      },
      priceRangeFilter("shopping"),
    ],
    card: {
      badge: (item) => {
        const purity = strAttr(item, "purity");
        if (purity && purity !== "Not Applicable") return { label: purity, tone: "info" };
        const occ = arrAttr(item, "occasion");
        if (occ.includes("Wedding")) return { label: "Bridal", tone: "info" };
        return occ[0] ? { label: occ[0], tone: "neutral" } : null;
      },
      subtitle: (item) =>
        [strAttr(item, "brand"), strAttr(item, "fabric_material")].filter(Boolean).join(" · "),
      chips: (item) =>
        [
          item?.audience === "bride" ? "Dulhan" : item?.audience === "groom" ? "Dulha" : null,
          arrAttr(item, "occasion")[0],
          strAttr(item, "fabric_material") || strAttr(item, "purity"),
          arrAttr(item, "work_embroidery")[0] || arrAttr(item, "stone_type")[0],
          strAttr(item, "pieces_included"),
        ].filter((c) => c && c !== "Not Applicable"),
      stats: (item) =>
        [
          strAttr(item, "purity") && strAttr(item, "purity") !== "Not Applicable"
            ? { label: "Purity", value: strAttr(item, "purity") }
            : null,
          strAttr(item, "warranty") && strAttr(item, "warranty") !== "No Warranty"
            ? { label: "Warranty", value: strAttr(item, "warranty") }
            : null,
          numAttr(item, "weight_gms")
            ? { label: "Weight", value: `${numAttr(item, "weight_gms")} g` }
            : null,
        ].filter(Boolean),
      priceCaption: "Price",
      ctaLabel: "Add to basket",
    },
  },
};

export function getListingConfig(slug) {
  return LISTING[String(slug || "").toLowerCase()] || null;
}

/* ------------------------- package configs ------------------------- */

/**
 * Feature matrix rows for package-tier cards. Two row kinds:
 *  value — shown with a check only when the attribute has a value
 *  bool  — always shown; green check when included, grey ✗ when not
 *          (the explicit-exclusion pattern from the photography mockup)
 */
const PACKAGES = {
  photography: {
    groups: [
      {
        title: "Photography",
        rows: (item) =>
          [
            strAttr(item, "team_size") ? { label: strAttr(item, "team_size"), included: true } : null,
            numAttr(item, "hours_covered")
              ? { label: `${numAttr(item, "hours_covered")} hrs coverage`, included: true }
              : null,
            numAttr(item, "edited_photos_count")
              ? { label: `${numAttr(item, "edited_photos_count")} edited photos`, included: true }
              : null,
            {
              label: numAttr(item, "album_pages")
                ? `Photobook album (${numAttr(item, "album_pages")} pages)`
                : "Photobook album",
              included: isIncluded(attr(item, "album_included")),
            },
            { label: "RAW photos", included: isIncluded(attr(item, "raw_photos_provided")) },
          ].filter(Boolean),
      },
      {
        title: "Videography",
        rows: (item) =>
          [
            {
              label: numAttr(item, "cinematic_video_mins")
                ? `Cinematic film (${numAttr(item, "cinematic_video_mins")} min)`
                : "Cinematic film",
              included: numAttr(item, "cinematic_video_mins") != null,
            },
            { label: "Drone coverage", included: isIncluded(attr(item, "drone_coverage")) },
            { label: "Same-day teaser", included: isIncluded(attr(item, "same_day_teaser")) },
          ].filter(Boolean),
      },
    ],
  },

  "makeup-and-mehndi": {
    groups: [
      {
        title: "Makeup",
        rows: (item) =>
          [
            strAttr(item, "makeup_type") && strAttr(item, "makeup_type") !== "Not Included"
              ? { label: `${strAttr(item, "makeup_type")} makeup`, included: true }
              : null,
            numAttr(item, "people_covered")
              ? { label: `${numAttr(item, "people_covered")} people covered`, included: true }
              : null,
            { label: "Hairstyling", included: isIncluded(attr(item, "hairstyling_included")) },
            { label: "Draping", included: isIncluded(attr(item, "draping_included")) },
            { label: "Trial session", included: isIncluded(attr(item, "trial_available")) },
            strAttr(item, "home_service")
              ? {
                  label:
                    strAttr(item, "home_service") === "Studio Only" ? "Studio only" : "Home visit",
                  included: strAttr(item, "home_service") !== "No",
                }
              : null,
          ].filter(Boolean),
      },
      {
        title: "Mehndi",
        rows: (item) => {
          const styles = arrAttr(item, "mehndi_style").filter((s) => s !== "Not Included");
          const coverage = strAttr(item, "mehndi_coverage");
          return [
            styles.length ? { label: styles.slice(0, 3).join(", "), included: true } : null,
            coverage && coverage !== "Not Included"
              ? { label: coverage, included: true }
              : { label: "Mehndi", included: false },
            numAttr(item, "mehndi_for_guests")
              ? { label: `Mehndi for ${numAttr(item, "mehndi_for_guests")} guests`, included: true }
              : null,
          ].filter(Boolean);
        },
      },
    ],
  },
};

export function getPackagesConfig(slug) {
  return PACKAGES[String(slug || "").toLowerCase()] || null;
}
