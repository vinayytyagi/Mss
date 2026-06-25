"use client";

/**
 * SectionsBuilder — the customer-facing "assemble your package" UI for
 * SECTIONS journey steps (wedding-invitation / streedhan / pagfera /
 * honeymoon) and the package tab of DUAL steps (catering "quote",
 * gifting "build").
 *
 * It fetches the admin-defined building blocks from
 *   GET /package-definitions?slug=<slug>&mode_key=<optional>
 * and renders each section by its `select` type:
 *   single   — radio-style option cards (pick one)
 *   multi    — checkable option cards; an option's sub_items reveal as
 *              selectable chips ONLY once the option itself is selected
 *   quantity — a preset row + stepper
 *
 * streedhan / pagfera UX: a section's detail block stays HIDDEN until the
 * customer engages it (single: any option picked; multi: ≥1 option picked;
 * quantity: qty > 0) — we hide, not disable. detail_fields render at the
 * bottom. A running indicative total shows when any chosen option carries
 * an indicative_price, otherwise "Custom quote". The CTA assembles a
 * PACKAGE cart line and adds it to the quote basket.
 *
 * An event date is REQUIRED before anything can be added to the basket; it
 * persists across steps via cartStore and rides along in selection.details.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Plus,
  Minus,
  Loader2,
  PackagePlus,
  Sparkles,
  Gift,
  Gem,
  Home,
  Tv,
  Car,
  Plane,
  Mail,
  Utensils,
  Cake,
  Heart,
  Star,
  ShoppingBag,
  CheckCircle2,
  CalendarHeart,
  CalendarCheck2,
  Smartphone,
  Scroll,
  Video,
  Printer,
  Newspaper,
  Sparkle,
  Stamp,
  Scissors,
  Armchair,
  Palmtree,
  Mountain,
  Candy,
  Coffee,
  Soup,
  Croissant,
  ChefHat,
  Salad,
  Flower2,
  Flame,
  Nut,
  Tag,
  Map,
  Bus,
  Hotel,
  Wand2,
  ClipboardList,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
import CityStateDropdown from "@/components/CityStateDropdown";
import { fetchPackageDefinition } from "@/lib/api";
import { addPackageToCart, getEventDate, setEventDate } from "@/lib/cartStore";
import { formatINR } from "@/lib/journeyStepUi";

/* Map an admin-supplied icon hint OR an option id/label to a DISTINCT,
   colourful lucide icon. Each entry is [Component, tailwindColorClass] so
   every option reads as its own thing. Resolution order in iconFor():
   explicit `icon` hint → option id → normalised label → neutral fallback. */
const ICON_MAP = {
  // generic hints
  gift: [Gift, "text-rose-500"],
  gem: [Gem, "text-amber-500"],
  jewellery: [Gem, "text-amber-500"],
  gold: [Gem, "text-amber-500"],
  home: [Home, "text-emerald-600"],
  household: [Home, "text-emerald-600"],
  furniture: [Armchair, "text-orange-600"],
  armchair: [Armchair, "text-orange-600"],
  electronics: [Tv, "text-indigo-500"],
  tv: [Tv, "text-indigo-500"],
  car: [Car, "text-sky-600"],
  automobile: [Car, "text-sky-600"],
  travel: [Plane, "text-sky-500"],
  plane: [Plane, "text-sky-500"],
  honeymoon: [Plane, "text-sky-500"],
  catering: [Utensils, "text-orange-500"],
  food: [Utensils, "text-orange-500"],
  cake: [Cake, "text-pink-500"],
  sweets: [Candy, "text-pink-500"],
  candy: [Candy, "text-pink-500"],
  heart: [Heart, "text-rose-500"],
  star: [Star, "text-amber-500"],
  hamper: [ShoppingBag, "text-fuchsia-500"],
  bag: [ShoppingBag, "text-fuchsia-500"],
  palmtree: [Palmtree, "text-teal-500"],
  mountain: [Mountain, "text-slate-500"],

  // wedding-invitation — STYLE (each a distinct meaningful icon)
  mail: [Mail, "text-rose-500"], // paper card
  invitation: [Mail, "text-rose-500"],
  paper: [Mail, "text-rose-500"],
  "paper cards": [Mail, "text-rose-500"],
  smartphone: [Smartphone, "text-violet-500"], // digital / phone
  digital: [Smartphone, "text-violet-500"],
  "digital invite": [Smartphone, "text-violet-500"],
  scroll: [Scroll, "text-amber-600"], // rolled scroll
  "scroll invite": [Scroll, "text-amber-600"],
  box: [Gift, "text-fuchsia-600"], // box / gift
  "box invitation": [Gift, "text-fuchsia-600"],
  video: [Video, "text-red-500"], // video invite
  "video invite": [Video, "text-red-500"],

  // wedding-invitation — PRINTING (each a distinct printing-type icon)
  "digital-print": [Printer, "text-sky-500"],
  "digital print": [Printer, "text-sky-500"],
  offset: [Newspaper, "text-slate-600"],
  "offset print": [Newspaper, "text-slate-600"],
  "gold-foil": [Sparkles, "text-amber-500"],
  "gold foil": [Sparkles, "text-amber-500"],
  embossed: [Stamp, "text-emerald-600"],
  laser: [Scissors, "text-fuchsia-500"],
  "laser cut": [Scissors, "text-fuchsia-500"],
  "silver-foil": [Sparkle, "text-zinc-400"],
  "silver foil": [Sparkle, "text-zinc-400"],
  letterpress: [Stamp, "text-emerald-600"],

  // honeymoon inclusions
  flights: [Plane, "text-sky-500"],
  "flights / train": [Plane, "text-sky-500"],
  hotel: [Hotel, "text-indigo-500"],
  "hotel / resort": [Hotel, "text-indigo-500"],
  transfers: [Bus, "text-amber-600"],
  sightseeing: [Map, "text-emerald-600"],
  setup: [Flower2, "text-rose-500"],
  "honeymoon room setup": [Flower2, "text-rose-500"],

  // catering — meal types / service style / cuisine
  breakfast: [Croissant, "text-amber-600"],
  lunch: [Soup, "text-orange-500"],
  "hi-tea": [Coffee, "text-amber-700"],
  dinner: [Utensils, "text-rose-500"],
  buffet: [Salad, "text-emerald-600"],
  plated: [ChefHat, "text-indigo-500"],
  "plated / sit-down": [ChefHat, "text-indigo-500"],
  live: [Flame, "text-red-500"],
  "live counters": [Flame, "text-red-500"],

  // gifting hamper items
  dryfruits: [Nut, "text-amber-700"],
  "dry fruits & nuts": [Nut, "text-amber-700"],
  personalised: [Tag, "text-fuchsia-500"],
  decor: [Flower2, "text-emerald-600"],

  // pagfera
  doli: [Car, "text-sky-600"],
  homecoming: [Home, "text-emerald-600"],
  shagun: [Gift, "text-rose-500"],
};

const FALLBACK_ICON = [Sparkles, "text-primary"];

function norm(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

/** Resolve an option to [IconComponent, colorClass] in priority order. */
function iconFor(option) {
  return (
    ICON_MAP[norm(option?.icon)] ||
    ICON_MAP[norm(option?.id)] ||
    ICON_MAP[norm(option?.label)] ||
    FALLBACK_ICON
  );
}

function OptionIcon({ option, className }) {
  const [Cmp, color] = iconFor(option);
  return <Cmp className={`${className} ${color}`} aria-hidden />;
}

const detailInputClass =
  "h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

/* ------------------------------ shells ----------------------------- */

function SectionShell({ index, title, subtitle, engaged, children }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)] sm:p-6">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            engaged
              ? "bg-success text-primary-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {engaged ? <Check className="h-3.5 w-3.5" strokeWidth={4} /> : index}
        </div>
        <h2 className="text-base font-bold text-text-strong sm:text-lg">
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="mt-1 ml-9 text-sm text-muted">{subtitle}</p>
      ) : null}
      <div className="mt-4 sm:ml-9">{children}</div>
    </section>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
      {children}
    </label>
  );
}

function CheckBadge({ active, round = false }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all ${
        round ? "rounded-full" : "rounded-md"
      } ${active ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface"}`}
      aria-hidden
    >
      {active ? <Check className="h-3 w-3" strokeWidth={4} /> : null}
    </span>
  );
}

/* ----------------------------- options ----------------------------- */

function OptionCard({ option, active, multi, onToggle, children }) {
  const hasImage = Boolean(option?.image_url);
  return (
    <div
      className={`rounded-xl border transition-all ${
        active
          ? "border-2 border-primary bg-primary-soft"
          : "border-border hover:border-primary"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        className="flex w-full items-start gap-3 p-3.5 text-left"
      >
        {hasImage ? (
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.image_url}
              alt={option.label || ""}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
        ) : (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              active ? "bg-primary/10" : "bg-surface-muted"
            }`}
          >
            <OptionIcon option={option} className="h-5 w-5" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-bold ${active ? "text-primary" : "text-text"}`}
          >
            {option.label}
          </span>
          {option.description ? (
            <span className="mt-0.5 block text-xs leading-relaxed text-muted">
              {option.description}
            </span>
          ) : null}
          {formatINR(option.indicative_price) ? (
            <span className="mt-1 inline-block text-xs font-semibold text-success">
              {formatINR(option.indicative_price)}
            </span>
          ) : null}
        </span>
        <CheckBadge active={active} round={!multi} />
      </button>
      {children}
    </div>
  );
}

function SubItemChips({ subItems, selectedIds, onToggle }) {
  if (!Array.isArray(subItems) || subItems.length === 0) return null;
  return (
    <div className="border-t border-primary/20 px-3.5 pb-3.5 pt-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        Add specifics
      </p>
      <div className="flex flex-wrap gap-2">
        {subItems.map((sub) => {
          const on = selectedIds.includes(sub.id);
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => onToggle(sub.id)}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-strong bg-surface text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One section. `value` is { optionIds:[], subItems:{[optId]:[subIds]},
 * quantity?:number }. `onChange` replaces it.
 */
function SectionBlock({ section, index, value, onChange }) {
  const select = section.select || "single";
  const optionIds = value.optionIds || [];
  const subItems = value.subItems || {};
  const quantity = Number(value.quantity) || 0;

  const engaged = select === "quantity" ? quantity > 0 : optionIds.length > 0;

  function toggleOption(optId) {
    if (select === "single") {
      const next = optionIds[0] === optId ? [] : [optId];
      onChange({ ...value, optionIds: next, subItems: {} });
      return;
    }
    // multi
    const has = optionIds.includes(optId);
    const nextIds = has
      ? optionIds.filter((id) => id !== optId)
      : [...optionIds, optId];
    const nextSub = { ...subItems };
    if (has) delete nextSub[optId];
    onChange({ ...value, optionIds: nextIds, subItems: nextSub });
  }

  function toggleSubItem(optId, subId) {
    const cur = subItems[optId] || [];
    const next = cur.includes(subId)
      ? cur.filter((id) => id !== subId)
      : [...cur, subId];
    onChange({ ...value, subItems: { ...subItems, [optId]: next } });
  }

  function setQuantity(n) {
    onChange({ ...value, quantity: Math.max(0, n) });
  }

  return (
    <SectionShell index={index} title={section.title} engaged={engaged}>
      {select === "quantity" ? (
        <QuantityControl
          options={section.options || []}
          quantity={quantity}
          onSelect={setQuantity}
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(section.options || []).map((option) => {
            const active = optionIds.includes(option.id);
            return (
              <OptionCard
                key={option.id}
                option={option}
                active={active}
                multi={select === "multi"}
                onToggle={() => toggleOption(option.id)}
              >
                {/* sub_items reveal ONLY once the option is selected */}
                {select === "multi" && active ? (
                  <SubItemChips
                    subItems={option.sub_items}
                    selectedIds={subItems[option.id] || []}
                    onToggle={(subId) => toggleSubItem(option.id, subId)}
                  />
                ) : null}
              </OptionCard>
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}

function QuantityControl({ options, quantity, onSelect }) {
  // Presets come from the section options' labels when numeric, else a sane
  // default ladder. Always pair with a free +/- stepper.
  const presets = (options || [])
    .map((o) => Number(String(o.label).replace(/[^\d]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  const ladder = presets.length ? presets : [50, 100, 200, 300, 500];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ladder.map((n) => {
          const active = quantity === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(active ? 0 : n)}
              aria-pressed={active}
              className={`min-w-16 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                active
                  ? "border-2 border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-text hover:border-primary"
              }`}
            >
              {new Intl.NumberFormat("en-IN", {
                maximumFractionDigits: 0,
              }).format(n)}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Or set exact
        </span>
        <div className="flex items-center overflow-hidden rounded-xl border border-border-strong">
          <button
            type="button"
            onClick={() => onSelect(Math.max(0, quantity - 10))}
            className="px-2.5 py-2 text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            min={0}
            value={quantity || ""}
            onChange={(e) => onSelect(Math.max(0, Number(e.target.value) || 0))}
            placeholder="0"
            className="w-20 border-x border-border-strong bg-surface px-2 py-2 text-center text-sm font-bold text-text outline-none"
          />
          <button
            type="button"
            onClick={() => onSelect(quantity + 10)}
            className="px-2.5 py-2 text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ helpers ---------------------------- */

function emptySectionValue(section) {
  return section?.select === "quantity"
    ? { optionIds: [], subItems: {}, quantity: 0 }
    : { optionIds: [], subItems: {} };
}

function computeIndicativeTotal(sections, state) {
  let total = 0;
  let priced = false;
  for (const section of sections) {
    const v = state[section.id] || {};
    const ids = v.optionIds || [];
    // quantity sections multiply their priced options by the chosen count.
    const multiplier =
      section.select === "quantity" ? Math.max(1, Number(v.quantity) || 0) : 1;
    let sectionSum = 0;
    for (const option of section.options || []) {
      if (!ids.includes(option.id)) continue;
      const p = Number(option.indicative_price);
      if (Number.isFinite(p) && p > 0) {
        priced = true;
        sectionSum += p;
      }
    }
    total += sectionSum * multiplier;
  }
  return { total, priced };
}

/** Build the PACKAGE cart line `selection.sections` shape from local state. */
function buildSelectionSections(sections, state) {
  const out = [];
  for (const section of sections) {
    const v = state[section.id] || {};
    const ids = v.optionIds || [];
    const qty = Number(v.quantity) || 0;
    if (ids.length === 0 && qty <= 0) continue;

    const options = (section.options || [])
      .filter((o) => ids.includes(o.id))
      .map((o) => {
        const subIds = (v.subItems && v.subItems[o.id]) || [];
        const subs = (o.sub_items || []).filter((s) => subIds.includes(s.id));
        return {
          id: o.id,
          label: o.label,
          ...(subs.length
            ? { sub_items: subs.map((s) => ({ id: s.id, label: s.label })) }
            : {}),
        };
      });

    out.push({
      id: section.id,
      options,
      ...(section.select === "quantity" && qty > 0 ? { quantity: qty } : {}),
    });
  }
  return out;
}

/** A human-readable structured summary for the live summary panel. */
function buildSummary(sections, state) {
  const rows = [];
  for (const section of sections) {
    const v = state[section.id] || {};
    const ids = v.optionIds || [];
    const qty = Number(v.quantity) || 0;
    if (ids.length === 0 && qty <= 0) continue;

    const chosen = (section.options || [])
      .filter((o) => ids.includes(o.id))
      .map((o) => {
        const subIds = (v.subItems && v.subItems[o.id]) || [];
        const subs = (o.sub_items || [])
          .filter((s) => subIds.includes(s.id))
          .map((s) => s.label);
        return { id: o.id, label: o.label, subs };
      });

    rows.push({
      id: section.id,
      title: section.title,
      chips: chosen,
      quantity: section.select === "quantity" && qty > 0 ? qty : null,
    });
  }
  return rows;
}

function formatEventDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------- main ------------------------------ */

export default function SectionsBuilder({
  step,
  slug,
  modeKey = null,
  onAdded,
}) {
  const effectiveSlug = slug || step?.slug || "";
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({});
  const [details, setDetails] = useState({});
  const [adding, setAdding] = useState(false);
  const [eventDate, setEventDateLocal] = useState("");

  // Hydrate the persisted event date once on mount (avoids SSR mismatch).
  useEffect(() => {
    setEventDateLocal(getEventDate());
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const def = await fetchPackageDefinition(effectiveSlug, modeKey);
        if (!alive) return;
        setDefinition(def);
        const seed = {};
        for (const s of def?.sections || []) {
          // A "tabs" section (category / type toggle) defaults to its first option.
          seed[s.id] =
            s.role === "tabs" && s.options?.[0]
              ? { optionIds: [s.options[0].id], subItems: {} }
              : emptySectionValue(s);
        }
        setState(seed);
        setDetails({});
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [effectiveSlug, modeKey]);

  const sections = useMemo(() => definition?.sections || [], [definition]);
  const detailFields = useMemo(
    () => definition?.detail_fields || [],
    [definition],
  );

  // Optional "tabs" section: a category / type toggle rendered as pills at the
  // top. Sections carrying a matching `group` only show under the active tab;
  // sections without a `group` always show.
  const tabsSection = useMemo(() => sections.find((s) => s.role === "tabs") || null, [sections]);
  const activeTab = tabsSection
    ? state[tabsSection.id]?.optionIds?.[0] || tabsSection.options?.[0]?.id || null
    : null;
  const visibleSections = useMemo(
    () =>
      sections.filter((s) => {
        if (s.role === "tabs") return false; // rendered separately as pills
        if (s.group) return s.group === activeTab;
        return true;
      }),
    [sections, activeTab],
  );

  const { total, priced } = useMemo(
    () => computeIndicativeTotal(sections, state),
    [sections, state],
  );

  const summaryRows = useMemo(
    () => buildSummary(sections, state),
    [sections, state],
  );

  const hasSelection = useMemo(
    () =>
      sections.some((s) => {
        if (s.role === "tabs") return false; // the category tab alone isn't a pick
        const v = state[s.id] || {};
        return (v.optionIds || []).length > 0 || (Number(v.quantity) || 0) > 0;
      }),
    [sections, state],
  );

  const hasDate = Boolean(String(eventDate || "").trim());
  const todayStr = new Date().toISOString().slice(0, 10);

  function setSection(id, next) {
    setState((prev) => ({ ...prev, [id]: next }));
  }
  function setDetail(key, val) {
    setDetails((prev) => ({ ...prev, [key]: val }));
  }
  function handleEventDate(value) {
    setEventDateLocal(value);
    setEventDate(value); // persist across steps
  }

  function handleAdd() {
    if (!hasDate) {
      toast.error("Please set your event date before adding to the basket.");
      return;
    }
    if (!hasSelection) {
      toast.error("Pick at least one option to build your package.");
      return;
    }
    // Required detail fields must be filled.
    const missing = detailFields.find(
      (f) => f.required && !String(details[f.key] || "").trim(),
    );
    if (missing) {
      toast.error(`Please fill "${missing.label}".`);
      return;
    }

    setAdding(true);
    const selectionSections = buildSelectionSections(sections, state);
    const line = {
      line_type: "package",
      journey_step_id: step?.step_id || "",
      journey_slug: effectiveSlug,
      journey_title: step?.title || definition?.title || "",
      mode_key: modeKey ?? null,
      package_title: definition?.title || step?.title || "Custom package",
      selection: {
        sections: selectionSections,
        details: { ...details, event_date: eventDate },
      },
      indicative_total: priced ? total : 0,
      quantity: 1,
    };
    addPackageToCart(line);
    toast.success("Added to Quote cart", {
      description: line.package_title,
    });
    // reset selections so the next package starts clean (keep event date).
    const seed = {};
    for (const s of sections) seed[s.id] = emptySectionValue(s);
    setState(seed);
    setDetails({});
    setAdding(false);
    onAdded?.();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!definition || sections.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-24 text-center shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
        <PackagePlus
          className="mx-auto h-12 w-12 text-primary/50"
          strokeWidth={1.5}
        />
        <p className="mt-4 text-base font-semibold text-text">
          Package builder coming soon
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          We&apos;re setting up the building blocks for this step. Check back
          shortly.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-5">
      {definition.subtitle ? (
        <p className="text-center text-sm text-muted">{definition.subtitle}</p>
      ) : null}

      {/* Category / type tabs — segmented control (like makeup/mehndi). */}
      {tabsSection ? (
        <div className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
          {(tabsSection.options || []).map((opt) => {
            const active = activeTab === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSection(tabsSection.id, { optionIds: [opt.id], subItems: {} })}
                aria-pressed={active}
                className={`flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-medium transition-all ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:bg-surface-muted"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {visibleSections.map((section, idx) => (
        <SectionBlock
          key={section.id}
          section={section}
          index={idx + 1}
          value={state[section.id] || emptySectionValue(section)}
          onChange={(next) => setSection(section.id, next)}
        />
      ))}

      {/* Your details — asked at the BOTTOM of every step (date + detail fields). */}
      <SectionShell index={visibleSections.length + 1} title="Your details" subtitle="A few specifics so we can quote accurately">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel>
              {definition?.date_label || "Event date"} <span className="text-primary">*</span>
            </FieldLabel>
            <input
              type="date"
              value={eventDate}
              min={todayStr}
              onChange={(e) => handleEventDate(e.target.value)}
              className={`h-11 w-full rounded-xl border bg-surface px-3 text-sm font-medium text-text outline-none transition focus:ring-2 focus:ring-primary/15 ${
                hasDate ? "border-border-strong focus:border-primary" : "border-danger/50 focus:border-danger"
              }`}
            />
            {!hasDate ? (
              <p className="mt-1 text-[11px] font-medium text-danger">
                Add your {(definition?.date_label || "event date").toLowerCase()} to continue.
              </p>
            ) : null}
          </div>
          {detailFields.map((f) => {
            const wide = f.type === "textarea";
            return (
              <div key={f.key} className={wide ? "sm:col-span-2" : ""}>
                <FieldLabel>
                  {f.label}
                  {f.required ? <span className="text-primary"> *</span> : null}
                </FieldLabel>
                {f.type === "city_state" ? (
                  <CityStateDropdown
                    value={details[f.key] || ""}
                    onChange={(sel) => setDetail(f.key, sel?.label || "")}
                  />
                ) : f.type === "select" ? (
                  <Dropdown
                    value={details[f.key] || ""}
                    onChange={(v) => setDetail(f.key, v)}
                    placeholder="Select…"
                    ariaLabel={f.label}
                    options={(f.options || []).map((o) => ({ value: o, label: o }))}
                  />
                ) : f.type === "textarea" ? (
                  <textarea
                    value={details[f.key] || ""}
                    onChange={(e) => setDetail(f.key, e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={details[f.key] || ""}
                    onChange={(e) => setDetail(f.key, e.target.value)}
                    className={detailInputClass}
                  />
                )}
              </div>
            );
          })}
        </div>
      </SectionShell>

      {/* ---------------------- Rich summary panel ---------------------- */}
      <div className="overflow-hidden rounded-xl border border-primary/30 bg-surface shadow-[0_12px_30px_rgba(255,79,134,0.08)]">
        <div className="flex items-center gap-2 border-b border-primary/15 bg-primary-soft px-5 py-4">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-base font-bold text-text-strong">
            Your selection
          </h2>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {/* Event date line */}
          <div className="flex items-center gap-2 text-sm">
            {hasDate ? (
              <>
                <CalendarCheck2
                  className="h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                <span className="font-semibold text-text">Event date:</span>
                <span className="text-muted">{formatEventDate(eventDate)}</span>
              </>
            ) : (
              <>
                <CalendarHeart
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="font-medium text-primary">
                  Set your event date above to continue
                </span>
              </>
            )}
          </div>

          {/* Selected sections as chips */}
          {summaryRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-surface-muted px-4 py-6 text-center text-sm text-muted">
              Nothing selected yet — pick options above and they&apos;ll appear
              here.
            </p>
          ) : (
            <ul className="space-y-3">
              {summaryRows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-border bg-surface-muted/40 p-3.5"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                    {row.title}
                    {row.quantity ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        ×
                        {new Intl.NumberFormat("en-IN", {
                          maximumFractionDigits: 0,
                        }).format(row.quantity)}
                      </span>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.chips.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
                      >
                        {c.label}
                        {c.subs.length ? (
                          <span className="font-normal text-primary/70">
                            · {c.subs.join(", ")}
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Indicative total / custom quote */}
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3.5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                Indicative total
              </p>
              <p className="mt-0.5 text-2xl font-bold text-primary">
                {priced && total > 0 ? formatINR(total) : "Custom quote"}
              </p>
            </div>
            <p className="max-w-[18rem] text-right text-xs text-primary/70">
              {priced && total > 0
                ? "An estimate — final pricing is confirmed in your tailored quote."
                : "Our team will price your selection and send a quote."}
            </p>
          </div>

          {/* What happens next */}
          <div className="flex items-start gap-2.5 rounded-xl bg-surface-muted px-4 py-3 text-xs text-muted">
            <Wand2
              className="mt-0.5 h-4 w-4 shrink-0 text-violet-500"
              aria-hidden
            />
            <p>
              <span className="font-semibold text-text">
                What happens next:{" "}
              </span>
              Add this to your quote basket, submit your enquiry, and our team
              reviews your picks and sends a tailored quote (usually within a
              few hours) — no payment now.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !hasSelection || !hasDate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_rgba(255,79,134,0.35)] transition-all hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
            {hasDate ? "Add to Quote cart" : "Set event date to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
