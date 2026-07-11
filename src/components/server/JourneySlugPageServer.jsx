import { notFound } from "next/navigation";
import JourneyStepPage from "@/components/JourneyStepPage";
import JourneyPackagesPage from "@/components/journey/JourneyPackagesPage";
import JourneySectionsPage from "@/components/journey/JourneySectionsPage";
import JourneyDualPage from "@/components/journey/JourneyDualPage";
import { getJourneyPageMode } from "@/lib/journeyStepUi";
import { fetchItems, fetchJourneyStep, fetchJourneySteps, fetchStepCategories, fetchAttributeSchema } from "@/lib/api";
import { getAuthUserServer } from "@/lib/authCookiesServer";

const SPECIAL_STEP_KINDS = {
  VENUE: "venue",
  DECOR: "decor",
  CATERING: "catering",
};

function getStepKindFromSlug(stepSlug = "") {
  const s = String(stepSlug || "").trim().toLowerCase();
  if (!s) return null;
  if (["venues", "venue"].includes(s)) return SPECIAL_STEP_KINDS.VENUE;
  if (["decor", "decors", "decoration", "decorations"].includes(s)) return SPECIAL_STEP_KINDS.DECOR;
  if (["catering", "caterings", "caterer", "caterers"].includes(s)) return SPECIAL_STEP_KINDS.CATERING;
  return null;
}

/** Prefer stable admin keys (ivenue / idecor / icatering), then slug. */
function resolveStepKind(step) {
  const key = String(step?.step_key || "").trim().toLowerCase();
  if (key === "ivenue") return SPECIAL_STEP_KINDS.VENUE;
  if (key === "idecor") return SPECIAL_STEP_KINDS.DECOR;
  if (key === "icatering") return SPECIAL_STEP_KINDS.CATERING;
  return getStepKindFromSlug(step?.slug);
}

function normLocPart(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseCityStateFromLabel(label) {
  const parts = String(label || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const city = parts[0] ? normLocPart(parts[0]) : "";
  const state = parts.length > 1 ? normLocPart(parts.slice(1).join(", ")) : "";
  return { city, state };
}

function getItemCityState(item) {
  const cRaw = item?.location_city;
  const sRaw = item?.location_state;
  const cDirect = normLocPart(cRaw);
  const sDirect = normLocPart(sRaw);
  if (cDirect && sDirect) return { city: cDirect, state: sDirect };
  if (sDirect && !cDirect) return { city: "", state: sDirect };
  if (cDirect && !sDirect) {
    const parsed = parseCityStateFromLabel(cRaw);
    if (parsed.city || parsed.state) return parsed;
    return { city: cDirect, state: "" };
  }
  const loc = normLocPart(item?.location || "");
  if (loc) return parseCityStateFromLabel(loc);
  return { city: "", state: "" };
}

/** Match signup city/state to item location_city + location_state (or legacy "City, State" in location_city). Items with no geo stay visible. */
function filterItemsBySignupLocationStrict(items, venueLocationLabel) {
  if (!Array.isArray(items) || items.length === 0) return items || [];
  const user = parseCityStateFromLabel(venueLocationLabel);
  if (!user.city && !user.state) return items;

  const matched = items.filter((item) => {
    const il = getItemCityState(item);
    if (!il.city && !il.state) return true;
    if (user.state && il.state && user.state !== il.state) return false;
    if (user.city && il.city && user.city !== il.city) return false;
    if (user.city && !user.state && il.city && user.city !== il.city) return false;
    if (user.state && !user.city && il.state && user.state !== il.state) return false;
    return true;
  });
  return matched.length > 0 ? matched : items;
}

function parseGuestCapacity(item) {
  const raw = item?.capacity ?? item?.max_guests ?? item?.guest_capacity ?? item?.maxGuests;
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return { min: 0, max: raw };

  const s = String(raw).trim().toLowerCase().replace(/\s+/g, " ");
  const range = s.match(/(\d+)\s*[-–to]+\s*(\d+)/i);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  const digits = s.match(/\d+/g);
  if (digits && digits.length >= 2) {
    const nums = digits.map(Number).filter((n) => n > 0);
    if (nums.length >= 2) return { min: Math.min(...nums), max: Math.max(...nums) };
  }
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (Number.isFinite(n) && n > 0) return { min: 0, max: n };
  return null;
}

function filterItemsByVenueGuestCount(items, guestCount) {
  if (!Array.isArray(items) || items.length === 0) return items;
  const G = Number(guestCount);
  if (!Number.isFinite(G) || G <= 0) return items;

  const matched = items.filter((item) => {
    const cap = parseGuestCapacity(item);
    if (!cap) return true;
    if (G > cap.max) return false;
    if (cap.min > 0 && G < cap.min) return false;
    return true;
  });
  return matched.length > 0 ? matched : items;
}

function decodeVenueLocParam(raw) {
  if (raw === undefined || raw === null) return "";
  const s0 = Array.isArray(raw) ? raw[0] : raw;
  const s = String(s0 || "").trim();
  if (!s) return "";
  try {
    return decodeURIComponent(s).trim();
  } catch {
    return s;
  }
}

function parsePositiveGuestQuery(raw) {
  if (raw === undefined || raw === null) return null;
  const t = String(Array.isArray(raw) ? raw[0] : raw).trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.round(n);
}

function parseNonNegIntQuery(raw) {
  if (raw === undefined || raw === null) return null;
  const t = String(raw).trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function filterItemsByPriceRange(items, pmin, pmax) {
  if (!Array.isArray(items) || items.length === 0) return items || [];
  const lo = pmin != null && Number.isFinite(pmin) ? pmin : null;
  const hi = pmax != null && Number.isFinite(pmax) ? pmax : null;
  if (lo == null && hi == null) return items;
  return items.filter((it) => {
    const p = Number(it?.final_price ?? it?.price) || 0;
    if (lo != null && p < lo) return false;
    if (hi != null && p > hi) return false;
    return true;
  });
}

function getStepBudgetCap(user, stepId, defaultBudget) {
  const allocations = Array.isArray(user?.onboarding?.budget_allocations)
    ? user.onboarding.budget_allocations
    : [];
  const current = allocations.find((a) => a.step_id === stepId);
  const raw = current?.amount ?? defaultBudget ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function categoryUrlSegment(c) {
  if (!c) return "";
  const s = String(c.slug || "").trim();
  return s || c.category_id || "";
}

/** Filterable facets from the admin schema: every select/multiselect field, in
 *  schema order, with its admin-managed options. Mirrors ShoppingPageServer so
 *  the journey-listing filters are driven by the same Journey-Options CMS that
 *  feeds the vendor listing form — add a field in admin and it becomes both a
 *  listing field and a customer filter. */
function facetsFromSchema(schema) {
  const attrs = Array.isArray(schema?.attributes) ? schema.attributes : [];
  return attrs
    // select/multiselect fields the admin hasn't hidden from the filter bar
    // (filterable === false → admin unchecked "Show in filter bar").
    .filter((a) => (a.type === "select" || a.type === "multiselect") && a.filterable !== false)
    .map((a) => ({
      key: a.key,
      label: a.label || a.key,
      options: Array.isArray(a.options) ? a.options : [],
    }));
}

/** Selected attribute filters from the URL → `{ key: [values] }` (one URL param
 *  per facet, comma-separated). Drives BOTH the server-side `attrs` query and
 *  the filter UI's active state. */
function parseSelectedAttributes(sp, facets) {
  const out = {};
  for (const facet of facets || []) {
    const raw = sp?.[facet.key];
    if (!raw) continue;
    const values = String(raw).split(",").map((s) => s.trim()).filter(Boolean);
    if (values.length) out[facet.key] = values;
  }
  return out;
}

function resolveJourneyCategorySelection(categories, categoryParam, subcategoryParam, subSubcategoryParam, defaultToFirst = true) {
  const tops = categories.filter((c) => !c.parent_category_id);
  if (tops.length === 0) {
    // Step has no categories — nothing to select. The UI hides all pills.
    return {
      effectiveCategoryId: "",
      effectiveSubcategoryId: "",
      effectiveSubSubcategoryId: "",
      selectedCategorySlug: "",
      selectedSubcategorySlug: "",
      selectedSubSubcategorySlug: "",
    };
  }

  const p = String(categoryParam || "").trim();
  let cat = null;
  if (p) {
    if (/^[a-f\d]{24}$/i.test(p)) cat = tops.find((c) => c.category_id === p) || null;
    if (!cat) cat = tops.find((c) => String(c.slug || "").trim().toLowerCase() === p.toLowerCase()) || null;
    if (!cat) cat = tops.find((c) => c.category_id === p) || null;
  }
  // Listing/dual steps default to "All" (show everything) so landing on a
  // step never hides the catalog behind a forced first-category filter.
  // Package steps still default to their first tab.
  if (!cat && defaultToFirst) cat = tops[0] || null;
  if (!cat) {
    return {
      effectiveCategoryId: "",
      effectiveSubcategoryId: "",
      effectiveSubSubcategoryId: "",
      selectedCategorySlug: "",
      selectedSubcategorySlug: "",
      selectedSubSubcategorySlug: "",
    };
  }

  const sp = String(subcategoryParam || "").trim();
  let sub = null;
  if (sp && cat) {
    const subs = categories.filter((c) => c.parent_category_id === cat.category_id);
    if (/^[a-f\d]{24}$/i.test(sp)) sub = subs.find((c) => c.category_id === sp) || null;
    if (!sub) sub = subs.find((c) => String(c.slug || "").trim().toLowerCase() === sp.toLowerCase()) || null;
    if (!sub) sub = subs.find((c) => c.category_id === sp) || null;
  }

  const ssp = String(subSubcategoryParam || "").trim();
  let subSub = null;
  if (ssp && sub) {
    const subsubs = categories.filter((c) => c.parent_category_id === sub.category_id);
    if (/^[a-f\d]{24}$/i.test(ssp)) subSub = subsubs.find((c) => c.category_id === ssp) || null;
    if (!subSub)
      subSub = subsubs.find((c) => String(c.slug || "").trim().toLowerCase() === ssp.toLowerCase()) || null;
    if (!subSub) subSub = subsubs.find((c) => c.category_id === ssp) || null;
  }

  return {
    effectiveCategoryId: cat?.category_id || "",
    effectiveSubcategoryId: sub?.category_id || "",
    effectiveSubSubcategoryId: subSub?.category_id || "",
    selectedCategorySlug: categoryUrlSegment(cat),
    selectedSubcategorySlug: sub ? categoryUrlSegment(sub) : "",
    selectedSubSubcategorySlug: subSub ? categoryUrlSegment(subSub) : "",
  };
}

export default async function JourneySlugPageServer({ params, searchParams }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const user = await getAuthUserServer();

  let step;
  try {
    step = await fetchJourneyStep(slug);
  } catch {
    notFound();
  }

  const pageMode = getJourneyPageMode(step.slug);

  // Sections steps (wedding-invitation / streedhan / pagfera / honeymoon)
  // render the SectionsBuilder package assembler — no vendor item grid, so
  // skip the catalog fetch + filter plumbing entirely.
  if (pageMode === "sections") {
    const sectionsSteps = await fetchJourneySteps();
    return (
      <main>
        <JourneySectionsPage steps={sectionsSteps} step={step} />
      </main>
    );
  }

  const categoryParam = resolvedSearchParams?.category || "";
  const subcategoryParam = resolvedSearchParams?.subcategory || resolvedSearchParams?.subcategory_id || "";
  const subSubcategoryParam =
    resolvedSearchParams?.subSubcategory ||
    resolvedSearchParams?.sub_subcategory ||
    resolvedSearchParams?.sub_subcategory_id ||
    "";
  const search = (resolvedSearchParams?.search || "").trim();

  // Shopping Dulha/Dulhan pill. Only "bride" | "groom" narrow the fetch;
  // anything else ("all" / absent) leaves the audience param off so the
  // backend returns everything. Passed straight to GET /items?audience=.
  const audienceRaw = String(
    Array.isArray(resolvedSearchParams?.audience)
      ? resolvedSearchParams.audience[0]
      : resolvedSearchParams?.audience || "",
  )
    .trim()
    .toLowerCase();
  const audienceFilter = audienceRaw === "bride" || audienceRaw === "groom" ? audienceRaw : "";

  const matchLocRaw = String(resolvedSearchParams?.matchLoc ?? "").trim().toLowerCase();
  const matchGuestsRaw = String(resolvedSearchParams?.matchGuests ?? "").trim().toLowerCase();
  const skipSignupLocationFilter = ["0", "off", "false"].includes(matchLocRaw);
  const skipSignupGuestFilter = ["0", "off", "false"].includes(matchGuestsRaw);

  /** Single product price cap in URL (?pmax). Step budget is the default when this is absent (until user customizes). */
  const productPriceMaxFromUrl = parseNonNegIntQuery(resolvedSearchParams?.pmax ?? resolvedSearchParams?.priceMax);

  const guestCountFromUrl = parsePositiveGuestQuery(resolvedSearchParams?.guestCount);
  const venueLocFromUrl = decodeVenueLocParam(resolvedSearchParams?.venueLoc);

  const budgetRaw = resolvedSearchParams?.budget;
  const budgetTrimmed =
    budgetRaw !== undefined && budgetRaw !== null ? String(budgetRaw).trim() : "";
  const capOff = String(resolvedSearchParams?.cap || "").toLowerCase() === "off";

  /** When set, this exact value is echoed in client links (?budget=) so filters stay in sync with the URL. */
  let budgetQueryValue = undefined;
  let appliedBudgetCap = null;

  if (capOff) {
    appliedBudgetCap = null;
    budgetQueryValue = undefined;
  } else if (budgetTrimmed !== "") {
    const n = Number(budgetTrimmed);
    if (Number.isFinite(n)) {
      budgetQueryValue = Math.max(0, Math.round(n));
      if (budgetQueryValue > 0) {
        appliedBudgetCap = budgetQueryValue;
      } else if (budgetQueryValue === 0) {
        appliedBudgetCap = 0;
      }
    }
  } else {
    const budgetCap = getStepBudgetCap(user, step.step_id, step.default_budget);
    appliedBudgetCap = budgetCap > 0 ? budgetCap : null;
  }

  const [steps, categories, schemaRes] = await Promise.all([
    fetchJourneySteps(),
    fetchStepCategories(slug),
    // Admin-managed attribute schema → the journey-listing filter facets. A
    // schema fetch failure must NOT break the page (filters fall back to the
    // static listing config defined in journeyStepUi).
    fetchAttributeSchema(step.slug).catch(() => null),
  ]);
  const attributeFacets = facetsFromSchema(schemaRes?.schema);
  // Selected filters from the URL → server-side `attrs` query (so filtering
  // happens in Mongo, and any admin-added filter works automatically) + the
  // filter UI's active state. Plus page + sort.
  const selectedAttributes = parseSelectedAttributes(resolvedSearchParams, attributeFacets);
  const attrsParam = Object.keys(selectedAttributes).length ? JSON.stringify(selectedAttributes) : undefined;

  const sel = resolveJourneyCategorySelection(
    categories,
    categoryParam,
    subcategoryParam,
    subSubcategoryParam,
    pageMode === "packages",
  );

  /** Step budget is for plan / UI only — item price band comes only from Product price (?pmin / ?pmax). */
  // 60s revalidate (was `no-store`) so navigating back/forth between journey
  // steps within a minute feels instant instead of re-fetching the same data.
  // Catalog changes still propagate within a minute.
  const itemsRes = await fetchItems(
    {
      journeyStepId: step.step_id,
      ...(sel.selectedCategorySlug ? { categorySlug: sel.selectedCategorySlug } : {}),
      ...(sel.selectedSubcategorySlug ? { subcategorySlug: sel.selectedSubcategorySlug } : {}),
      // sub-sub doesn't have a slug-resolver on the backend — pass the id directly.
      ...(sel.effectiveSubSubcategoryId ? { subSubcategoryId: sel.effectiveSubSubcategoryId } : {}),
      ...(search ? { search } : {}),
      // Dulha/Dulhan shopping filter — server-side narrowing via ?audience=.
      ...(audienceFilter ? { audience: audienceFilter } : {}),
      // Dynamic attribute filters — server-side (Mongo) narrowing.
      ...(attrsParam ? { attrs: attrsParam } : {}),
      limit: 500,
    },
    { cacheMode: "revalidate", revalidateSeconds: 60 },
  );

  const stepKind = resolveStepKind(step);
  const profileVenueLocation = user?.onboarding?.venue_location;
  const profileGuestsCount = user?.onboarding?.guests_count;

  const effectiveVenueLocation =
    String(venueLocFromUrl || "").trim() || String(profileVenueLocation || "").trim();
  const effectiveGuestCount = guestCountFromUrl ?? (Number(profileGuestsCount) > 0 ? Number(profileGuestsCount) : 0);

  const locStep =
    stepKind === SPECIAL_STEP_KINDS.VENUE ||
    stepKind === SPECIAL_STEP_KINDS.DECOR ||
    stepKind === SPECIAL_STEP_KINDS.CATERING;
  const canOfferSignupLocFilter =
    locStep && (!!String(effectiveVenueLocation || "").trim() || !!user);
  const canOfferSignupGuestFilter = stepKind === SPECIAL_STEP_KINDS.VENUE && (!!user || guestCountFromUrl != null);

  const applySignupLocationFilter =
    locStep && !!String(effectiveVenueLocation || "").trim() && !skipSignupLocationFilter;
  const applySignupGuestFilter =
    stepKind === SPECIAL_STEP_KINDS.VENUE &&
    !skipSignupGuestFilter &&
    Number.isFinite(effectiveGuestCount) &&
    effectiveGuestCount > 0;

  let items = itemsRes.items || [];
  if (applySignupLocationFilter) {
    items = filterItemsBySignupLocationStrict(items, effectiveVenueLocation);
  }
  if (applySignupGuestFilter) {
    items = filterItemsByVenueGuestCount(items, effectiveGuestCount);
  }
  const productPriceCap =
    productPriceMaxFromUrl != null
      ? productPriceMaxFromUrl
      : !capOff && appliedBudgetCap != null
        ? appliedBudgetCap
        : null;
  items = filterItemsByPriceRange(items, null, productPriceCap);

  // Dual steps (catering / gifting) render a tab shell: the vendor product
  // grid (this filtered catalog) plus the SectionsBuilder package tab.
  if (pageMode === "dual") {
    return (
      <main>
        {/* key per step so client tab/pagination state re-inits when navigating
            between dual steps (e.g. catering ⇄ gifting). */}
        <JourneyDualPage key={step.step_id} steps={steps} step={step} items={items} />
      </main>
    );
  }

  // Package steps (photography / makeup-and-mehndi) render the catalog
  // as tier-comparison cards with category tabs instead of the grid.
  if (pageMode === "packages") {
    return (
      <main>
        <JourneyPackagesPage
          steps={steps}
          step={step}
          categories={categories}
          items={items}
          selectedCategoryId={sel.effectiveCategoryId}
          selectedCategorySlug={sel.selectedCategorySlug}
        />
      </main>
    );
  }

  return (
    <main>
      <JourneyStepPage
        steps={steps}
        step={step}
        categories={categories}
        items={items}
        attributeFacets={attributeFacets}
        selectedAttributes={selectedAttributes}
        selectedCategoryId={sel.effectiveCategoryId}
        selectedSubcategoryId={sel.effectiveSubcategoryId}
        selectedSubSubcategoryId={sel.effectiveSubSubcategoryId}
        selectedCategorySlug={sel.selectedCategorySlug}
        selectedSubcategorySlug={sel.selectedSubcategorySlug}
        selectedSubSubcategorySlug={sel.selectedSubSubcategorySlug}
        search={search}
        appliedBudgetCap={appliedBudgetCap}
        budgetQueryValue={budgetQueryValue}
        capOffActive={capOff}
        showSignupLocFilter={canOfferSignupLocFilter}
        showSignupGuestFilter={canOfferSignupGuestFilter}
        matchLocOff={skipSignupLocationFilter}
        matchGuestsOff={skipSignupGuestFilter}
        productPriceCap={productPriceCap}
        productPriceMaxForUrl={productPriceMaxFromUrl == null ? undefined : productPriceMaxFromUrl}
        guestCountForUrl={guestCountFromUrl == null ? undefined : guestCountFromUrl}
        venueLocForUrl={venueLocFromUrl ? venueLocFromUrl : undefined}
        effectiveGuestCount={effectiveGuestCount}
        effectiveVenueLocation={effectiveVenueLocation}
      />
    </main>
  );
}
