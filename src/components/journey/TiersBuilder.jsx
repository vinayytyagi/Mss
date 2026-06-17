"use client";

/**
 * TiersBuilder — customer-facing "tiers" package builder for journey steps
 * whose admin-defined package definition uses `builder_type:"tiers"`
 * (photography: 3 base packages per row + add-ons; makeup-and-mehndi:
 * makeup|mehndi tabs, tiers filtered by tab).
 *
 * Flow:
 *   GET /api/v1/package-definitions?slug=<journey_slug>
 *     -> { definition: { builder_type:"tiers", title, subtitle, tabs?, tiers[],
 *                        addons?, detail_fields[], gallery? } }
 *   User picks an event date (required), selects ONE tier, toggles any add-ons
 *   (gated until a tier is chosen) and fills the detail fields. A rich, sticky
 *   summary shows the chosen tier, add-on chips, the event date and the running
 *   indicative total (or "Custom quote"). The CTA builds a PACKAGE quotation
 *   cart line (line_type:"package") via addPackageToCart.
 *
 * Theme tokens only (text-text / text-muted / bg-surface / border-border /
 * primary / success / …) and colourful lucide icons — no emojis.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  Plus,
  Sparkles,
  Star,
  Crown,
  PackagePlus,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Receipt,
  Lock,
  CalendarDays,
  Camera,
  Images,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { addPackageToCart, getEventDate, setEventDate } from "@/lib/cartStore";
import { formatINR } from "@/lib/journeyStepUi";
import Dropdown from "@/components/ui/Dropdown";
import CityStateDropdown from "@/components/CityStateDropdown";

/* Rotating accent icons for tier headers (colourful, not emojis). */
const TIER_ICONS = [Sparkles, Star, Crown];
const GALLERY_ALL = "__all__";

function priceOf(node) {
  const n = Number(node?.indicative_price);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Pretty-print a YYYY-MM-DD value (falls back to the raw value). */
function formatEventDate(value) {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TiersBuilder({ slug, modeKey = null, journeyStepId = "", journeyTitle = "" }) {
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("");
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [details, setDetails] = useState({});
  const [eventDate, setEventDateState] = useState("");
  const [galleryFilter, setGalleryFilter] = useState(GALLERY_ALL);
  const [adding, setAdding] = useState(false);

  // Hydrate the event date from the shared cart store on mount (client-only).
  useEffect(() => {
    setEventDateState(getEventDate());
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const qs = new URLSearchParams({ slug: String(slug || "") });
        if (modeKey) qs.set("mode_key", String(modeKey));
        const res = await apiFetch(`/package-definitions?${qs.toString()}`, {
          cacheMode: "revalidate",
          revalidateSeconds: 60,
        });
        if (!active) return;
        const def = res?.definition || null;
        setDefinition(def);
        if (def?.tabs?.length) setActiveTab(def.tabs[0].key);
      } catch (e) {
        if (active) setError(e?.message || "Couldn't load packages.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, modeKey]);

  const tabs = useMemo(() => definition?.tabs || [], [definition]);
  const allTiers = useMemo(() => definition?.tiers || [], [definition]);
  const addons = useMemo(() => definition?.addons || [], [definition]);
  const detailFields = useMemo(() => definition?.detail_fields || [], [definition]);
  const gallery = useMemo(
    () => (Array.isArray(definition?.gallery) ? definition.gallery.filter((g) => g?.url) : []),
    [definition],
  );

  // Distinct gallery categories (preserve first-seen order) + an "All" pill.
  const galleryCategories = useMemo(() => {
    const seen = [];
    gallery.forEach((g) => {
      const c = String(g.category || "").trim();
      if (c && !seen.includes(c)) seen.push(c);
    });
    return seen;
  }, [gallery]);

  const filteredGallery = useMemo(() => {
    if (galleryFilter === GALLERY_ALL) return gallery;
    return gallery.filter((g) => String(g.category || "").trim() === galleryFilter);
  }, [gallery, galleryFilter]);

  // Makeup/mehndi: tiers carry a `tab` key; filter to the active tab. Photography
  // has no tabs, so every tier shows in one 3-per-row grid.
  const visibleTiers = useMemo(() => {
    if (!tabs.length) return allTiers;
    return allTiers.filter((t) => (t.tab || tabs[0]?.key) === activeTab);
  }, [allTiers, tabs, activeTab]);

  // Reset tier selection (and any gated add-ons) when switching tabs to a tab
  // that doesn't contain the current tier.
  useEffect(() => {
    if (selectedTierId && !visibleTiers.some((t) => t.id === selectedTierId)) {
      setSelectedTierId("");
      setSelectedAddonIds([]);
    }
  }, [visibleTiers, selectedTierId]);

  const selectedTier = allTiers.find((t) => t.id === selectedTierId) || null;
  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));
  const addonsLocked = !selectedTierId;
  const hasDate = Boolean(eventDate);

  // Running indicative total — only count priced nodes. Any priced node makes the
  // total a number; if nothing is priced we surface "Custom quote".
  const { total, hasPrice } = useMemo(() => {
    let sum = 0;
    let priced = false;
    if (selectedTier && priceOf(selectedTier) > 0) {
      sum += priceOf(selectedTier);
      priced = true;
    }
    selectedAddons.forEach((a) => {
      if (priceOf(a) > 0) {
        sum += priceOf(a);
        priced = true;
      }
    });
    return { total: sum, hasPrice: priced };
  }, [selectedTier, selectedAddons]);

  function selectTier(id) {
    // Toggling tier off clears any selected add-ons (they are gated on the tier).
    if (id === selectedTierId) {
      setSelectedTierId("");
      setSelectedAddonIds([]);
      return;
    }
    setSelectedTierId(id);
  }

  function toggleAddon(id) {
    if (addonsLocked) return;
    setSelectedAddonIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function setDetail(key, value) {
    setDetails((cur) => ({ ...cur, [key]: value }));
  }

  function onEventDateChange(value) {
    setEventDateState(value);
    setEventDate(value);
  }

  function missingRequiredField() {
    return detailFields.find(
      (f) => f.required && String(details[f.key] ?? "").trim() === "",
    );
  }

  function handleAddToQuote() {
    if (!selectedTier) {
      toast.error("Please choose a package first.");
      return;
    }
    if (!hasDate) {
      toast.error("Please add your event date first.");
      return;
    }
    const missing = missingRequiredField();
    if (missing) {
      toast.error(`Please fill in “${missing.label}”.`);
      return;
    }
    setAdding(true);
    try {
      addPackageToCart({
        journey_step_id: journeyStepId,
        journey_slug: slug,
        journey_title: journeyTitle || definition?.title || "",
        mode_key: modeKey,
        package_title: definition?.title
          ? `${definition.title} — ${selectedTier.name}`
          : selectedTier.name,
        selection: {
          tier: { id: selectedTier.id, name: selectedTier.name },
          addons: selectedAddons.map((a) => ({ id: a.id, name: a.name })),
          details: { ...details, event_date: eventDate },
          event_date: eventDate,
        },
        indicative_total: hasPrice ? total : 0,
      });
      toast.success("Added to quote cart", { description: selectedTier.name });
      setSelectedTierId("");
      setSelectedAddonIds([]);
      setDetails({});
    } finally {
      setAdding(false);
    }
  }

  /* ----------------------------- states ----------------------------- */

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-danger/30 bg-danger/5 px-6 py-20 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-danger" />
        <p className="mt-3 text-sm font-semibold text-danger">{error}</p>
      </div>
    );
  }

  if (!definition || !allTiers.length) {
    return (
      <div className="rounded-[28px] border border-border bg-surface px-6 py-32 text-center shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
        <PackagePlus className="mx-auto h-9 w-9 text-subtle" />
        <p className="mt-3 text-base font-semibold text-text">No packages here yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Check back soon — packages for this step will show up here once they are added.
        </p>
      </div>
    );
  }

  const canSubmit = Boolean(selectedTier) && hasDate && !adding;

  return (
    <div className="space-y-7">
      {/* Heading */}
      {(definition.title || definition.subtitle) ? (
        <div className="text-center">
          {definition.title ? (
            <h2 className="text-2xl font-bold text-text-strong">{definition.title}</h2>
          ) : null}
          {definition.subtitle ? (
            <p className="mx-auto mt-1.5 max-w-2xl text-sm text-muted">{definition.subtitle}</p>
          ) : null}
        </div>
      ) : null}

      {/* Tabs (makeup | mehndi) */}
      {tabs.length > 1 ? (
        <div className="mx-auto flex max-w-md overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-[0_12px_30px_rgba(0,0,0,0.03)]">
          {tabs.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted hover:bg-surface-muted"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Tier cards — 3 per row on desktop */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {visibleTiers.map((tier, index) => {
          const Icon = TIER_ICONS[index % TIER_ICONS.length];
          const selected = tier.id === selectedTierId;
          const tierPrice = priceOf(tier);
          const features = tier.features || [];
          const cover = tier.image_url;
          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => selectTier(tier.id)}
              aria-pressed={selected}
              className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-surface text-left shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 ${
                selected
                  ? "border-primary ring-2 ring-primary/30 shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
                  : "border-border hover:border-primary/40 hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
              }`}
            >
              {tier.popular ? (
                <span className="absolute right-0 top-4 z-10 inline-flex items-center gap-1 rounded-l-md bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
                  <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} /> Popular
                </span>
              ) : null}

              {/* Cover image (when present) */}
              {cover ? (
                <div className="relative h-36 w-full overflow-hidden bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt={tier.name} className="h-full w-full object-cover" />
                  {selected ? (
                    <span className="absolute inset-0 ring-2 ring-inset ring-primary/40" />
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      selected ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold leading-snug text-text-strong">
                      {tier.name}
                    </h3>
                    {tier.badge ? (
                      <span className="text-[11px] font-semibold text-warning-strong">{tier.badge}</span>
                    ) : null}
                  </div>
                </div>

                {tier.tagline ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted">{tier.tagline}</p>
                ) : null}

                <div className="my-4 h-px bg-border" />

                <ul className="flex-1 space-y-1.5">
                  {features.map((f, i) => (
                    <li
                      key={`${tier.id}-f-${i}`}
                      className={`flex items-start gap-2 text-xs ${
                        f.included ? "text-text" : "text-subtle line-through decoration-border-strong"
                      }`}
                    >
                      {f.included ? (
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={3} />
                      ) : (
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-border-strong" strokeWidth={3} />
                      )}
                      <span>{f.group ? <span className="font-semibold">{f.group}: </span> : null}{f.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                      Indicative
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {tierPrice > 0 ? formatINR(tierPrice) : "Custom quote"}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                      selected
                        ? "bg-success text-primary-foreground"
                        : "bg-primary-soft text-primary"
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Selected
                      </>
                    ) : (
                      "Choose"
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add-ons — gated until a base tier is selected */}
      {addons.length ? (
        <div
          className={`rounded-xl border bg-surface p-5 transition ${
            addonsLocked ? "border-border" : "border-border"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-strong">
              <PackagePlus className="h-4 w-4 text-primary" /> Optional add-ons
            </h3>
            {addonsLocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning-strong">
                <Lock className="h-3 w-3" /> Select a package first
              </span>
            ) : null}
          </div>
          <div
            className={`mt-3 grid gap-3 sm:grid-cols-2 ${
              addonsLocked ? "pointer-events-none select-none opacity-50" : ""
            }`}
            aria-disabled={addonsLocked}
          >
            {addons.map((addon) => {
              const on = !addonsLocked && selectedAddonIds.includes(addon.id);
              const addonPrice = priceOf(addon);
              const cover = addon.image_url;
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  disabled={addonsLocked}
                  aria-pressed={on}
                  className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-left transition ${
                    addonsLocked ? "cursor-not-allowed" : ""
                  } ${
                    on
                      ? "border-primary bg-primary-soft/50 ring-1 ring-primary/30"
                      : "border-border-strong bg-surface hover:border-primary/40"
                  }`}
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={addon.name}
                        className="mt-0.5 h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"
                        }`}
                      >
                        {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        {cover && on ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />
                        ) : null}
                        <span className="block text-sm font-semibold text-text-strong">{addon.name}</span>
                      </span>
                      {addon.description ? (
                        <span className="mt-0.5 block text-xs leading-5 text-muted">{addon.description}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    {addonPrice > 0 ? `+${formatINR(addonPrice)}` : "Quote"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* DETAILS_BLOCK_START */}
      {/* Detail fields + required event date — rendered at the BOTTOM (below the
          sample gallery) so the date / details are the last thing asked. */}
      <div className="rounded-xl border border-border bg-surface p-5" data-details-block>
        <h3 className="flex items-center gap-2 text-sm font-bold text-text-strong">
          <Receipt className="h-4 w-4 text-primary" /> Your event details
        </h3>
        <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
          {/* Required event date — persisted via the shared cart store */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-subtle">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> {definition?.date_label || "Event date"}
              </span>
              <span className="ml-0.5 text-danger">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => onEventDateChange(e.target.value)}
              className={`h-11 w-full rounded-xl border bg-surface px-3.5 text-sm font-medium text-text outline-none transition focus:ring-2 focus:ring-primary/15 ${
                hasDate ? "border-border-strong focus:border-primary" : "border-danger/50 focus:border-danger"
              }`}
            />
            {!hasDate ? (
              <p className="mt-1 text-[11px] font-medium text-danger">
                Add your event date to continue.
              </p>
            ) : null}
          </div>

          {detailFields.map((field) => {
            const value = details[field.key] ?? "";
            const labelEl = (
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-subtle">
                {field.label}
                {field.required ? <span className="ml-0.5 text-danger">*</span> : null}
              </label>
            );
            const fieldClass =
              "h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

            if (field.type === "city_state") {
              return (
                <div key={field.key} className="sm:col-span-2">
                  {labelEl}
                  <CityStateDropdown
                    value={value}
                    onChange={(sel) => setDetail(field.key, sel?.label || "")}
                  />
                </div>
              );
            }
            if (field.type === "textarea") {
              return (
                <div key={field.key} className="sm:col-span-2">
                  {labelEl}
                  <textarea
                    value={value}
                    onChange={(e) => setDetail(field.key, e.target.value)}
                    className="min-h-24 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              );
            }
            if (field.type === "select") {
              const options = (field.options || []).map((opt) => {
                const v = typeof opt === "string" ? opt : opt.value ?? opt.label;
                const l = typeof opt === "string" ? opt : opt.label ?? opt.value;
                return { value: String(v), label: String(l) };
              });
              return (
                <div key={field.key}>
                  {labelEl}
                  <Dropdown
                    value={value}
                    onChange={(v) => setDetail(field.key, v)}
                    options={options}
                    placeholder="Select…"
                    ariaLabel={field.label}
                  />
                </div>
              );
            }
            return (
              <div key={field.key}>
                {labelEl}
                <input
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={value}
                  onChange={(e) => setDetail(field.key, e.target.value)}
                  className={fieldClass}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Photography sample gallery — "Our work" (kept at the very bottom, below the form). */}
      {gallery.length ? (
        <div className="rounded-lg border border-border bg-surface p-5" data-gallery-block>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text-strong">
              <Camera className="h-4 w-4 text-primary" /> Our work — samples
            </h3>
            {galleryCategories.length ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGalleryFilter(GALLERY_ALL)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    galleryFilter === GALLERY_ALL
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-muted hover:text-text"
                  }`}
                >
                  All
                </button>
                {galleryCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGalleryFilter(cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      galleryFilter === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-muted text-muted hover:text-text"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {filteredGallery.length ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredGallery.map((item, i) => (
                <figure
                  key={`${item.url}-${i}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.label || "Sample work"}
                    className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.label ? (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent px-3 pb-2 pt-6 text-xs font-semibold text-white">
                      {item.label}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
              <Images className="h-7 w-7 text-subtle" />
              <p className="mt-2 text-sm text-muted">No samples in this category yet.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Rich summary + CTA */}
      <div className=" bottom-4 z-10 overflow-hidden rounded-xl border border-primary/30 bg-surface">
        <div className="border-b border-border bg-primary-soft/40 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
            <ShoppingBag className="h-3.5 w-3.5" /> Your selection
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {selectedTier ? (
            <div className="space-y-3">
              {/* Chosen tier + total */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm font-bold text-text-strong">{selectedTier.name}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {hasDate ? (
                      <span>Event date: <span className="font-semibold text-text">{formatEventDate(eventDate)}</span></span>
                    ) : (
                      <span className="text-danger">Event date required</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-subtle">
                    {hasPrice ? "Indicative total" : "Estimate"}
                  </div>
                  <div className="text-xl font-bold text-text-strong">
                    {hasPrice ? formatINR(total) : "Custom quote"}
                  </div>
                </div>
              </div>

              {/* Selected add-ons as chips */}
              {selectedAddons.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAddons.map((a) => {
                    const p = priceOf(a);
                    return (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/50 px-2.5 py-1 text-[11px] font-semibold text-primary"
                      >
                        <Plus className="h-3 w-3" strokeWidth={3} />
                        {a.name}
                        {p > 0 ? <span className="text-text-strong">· {formatINR(p)}</span> : null}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-subtle">No add-ons selected.</p>
              )}

              {/* What happens next */}
              <div className="flex items-start gap-2 rounded-xl bg-surface-muted px-3 py-2.5">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-[11px] leading-5 text-muted">
                  {hasPrice
                    ? "This is an indicative estimate. Our admin team will review your picks and send a tailored custom quote to confirm."
                    : "Our admin team will review your selection and send a tailored custom quote — no payment now."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted">
              <PackagePlus className="h-4 w-4 text-subtle" />
              Choose a package above to build your quote.
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-subtle">
              {!selectedTier
                ? "Select a package to continue."
                : !hasDate
                ? "Add your event date to add this to your quote cart."
                : "Ready — add this package to your quote cart."}
            </p>
            <button
              type="button"
              onClick={handleAddToQuote}
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
              Add to quote cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
