"use client";

/**
 * JourneyEnquiryPage — request-builder page mode for journey steps whose
 * mockups are enquiry forms rather than listings (honeymoon, pagfera,
 * streedhan, wedding-invitation).
 *
 * Renders the step's declarative config from lib/journeyEnquiryConfig.js
 * as numbered sections (per the mockups), keeps one flat state object,
 * and on submit composes a structured WhatsApp message via the central
 * whatsapp helper — there is no enquiry API yet, so WhatsApp is the
 * channel that actually reaches the team today. The success state shows
 * a reference number that is embedded in the message itself.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, CircleCheck } from "lucide-react";
import JourneyStepStrip from "@/components/journey/JourneyStepStrip";
import JourneyStepNav from "@/components/journey/JourneyStepNav";
import { getEnquiryConfig } from "@/lib/journeyEnquiryConfig";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/* ------------------------------ shells ----------------------------- */

function SectionShell({ number, title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-[0_12px_30px_rgba(0,0,0,0.03)] sm:p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {number}
        </div>
        <h2 className="text-base font-bold text-text-strong sm:text-lg">{title}</h2>
      </div>
      {subtitle ? <p className="mt-1 ml-9 text-sm text-muted">{subtitle}</p> : null}
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

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-muted hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function CheckCircle({ active }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface"
      }`}
      aria-hidden
    >
      {active ? <Check className="h-3 w-3" strokeWidth={4} /> : null}
    </span>
  );
}

const selectClass =
  "h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm font-medium text-text outline-none focus:border-primary";

/* ---------------------------- sections ----------------------------- */

function DestinationPicker({ section, state, set }) {
  const mode = state[`${section.key}_mode`] || section.toggles[0].value;
  const tiles = section.tileSets[mode] || [];
  const choice = state[`${section.key}_choice`] || "";

  return (
    <div>
      <div className="mb-4 flex overflow-hidden rounded-xl border-2 border-primary">
        {section.toggles.map((t, i) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              set(`${section.key}_mode`, t.value);
              set(`${section.key}_choice`, "");
            }}
            className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-all ${
              mode === t.value ? "bg-primary text-primary-foreground" : "bg-surface text-primary hover:bg-primary-soft"
            } ${i > 0 ? "border-l-2 border-primary" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
        Popular {mode} destinations
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {tiles.map((tile) => {
          const active = choice === tile.name;
          return (
            <button
              key={tile.name}
              type="button"
              onClick={() => set(`${section.key}_choice`, active ? "" : tile.name)}
              aria-pressed={active}
              className={`rounded-xl border p-2.5 text-center transition-all ${
                active ? "border-2 border-primary bg-primary-soft" : "border-border hover:border-primary"
              }`}
            >
              <span className="block text-xl">{tile.icon}</span>
              <span className={`block text-xs font-semibold ${active ? "text-primary" : "text-muted"}`}>
                {tile.name}
              </span>
              <span className="block text-[10px] text-subtle">{tile.tag}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <FieldLabel>{section.otherLabel}</FieldLabel>
        <input
          type="text"
          value={state[`${section.key}_other`] || ""}
          onChange={(e) => set(`${section.key}_other`, e.target.value)}
          placeholder={section.otherPlaceholder}
          className={selectClass}
        />
      </div>
    </div>
  );
}

function FormGrid({ section, state, set }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {section.fields.map((f) => (
        <div key={f.key} className={f.input === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}>
          <FieldLabel>{f.label}</FieldLabel>
          {f.input === "select" ? (
            <select
              value={state[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              className={selectClass}
            >
              <option value="">Select…</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.input === "textarea" ? (
            <textarea
              value={state[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={3}
              className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          ) : (
            <input
              type={f.input}
              value={state[f.key] || ""}
              onChange={(e) => set(f.key, e.target.value)}
              placeholder={f.placeholder}
              className={selectClass}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CheckCards({ section, state, set }) {
  const selected = state[section.key] || [];
  function toggle(title) {
    set(
      section.key,
      selected.includes(title) ? selected.filter((t) => t !== title) : [...selected, title],
    );
  }
  const chipsSelected = section.chipsKey ? state[section.chipsKey] || [] : [];

  return (
    <div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {section.options.map((opt) => {
          const active = selected.includes(opt.title);
          return (
            <button
              key={opt.title}
              type="button"
              onClick={() => toggle(opt.title)}
              aria-pressed={active}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                active ? "border-primary bg-primary-soft" : "border-border hover:border-primary"
              }`}
            >
              <span className="text-xl leading-none">{opt.icon}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${active ? "text-primary" : "text-text"}`}>
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{opt.desc}</span>
              </span>
              <CheckCircle active={active} />
            </button>
          );
        })}
      </div>

      {section.chipsKey ? (
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            {section.chipsLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {section.chipsOptions.map((c) => (
              <Chip
                key={c}
                active={chipsSelected.includes(c)}
                onClick={() =>
                  set(
                    section.chipsKey,
                    chipsSelected.includes(c)
                      ? chipsSelected.filter((x) => x !== c)
                      : [...chipsSelected, c],
                  )
                }
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChipsWithText({ section, state, set }) {
  const selected = state[section.key] || [];
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {section.options.map((c) => (
          <Chip
            key={c}
            active={selected.includes(c)}
            onClick={() =>
              set(
                section.key,
                selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c],
              )
            }
          >
            {c}
          </Chip>
        ))}
      </div>
      <textarea
        value={state[section.textKey] || ""}
        onChange={(e) => set(section.textKey, e.target.value)}
        placeholder={section.placeholder}
        rows={3}
        className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
      />
    </div>
  );
}

function ServiceCards({ section, state, set }) {
  const selected = state[section.key] || [];
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {section.options.map((opt) => {
        const active = selected.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() =>
              set(
                section.key,
                active ? selected.filter((k) => k !== opt.key) : [...selected, opt.key],
              )
            }
            aria-pressed={active}
            className={`relative rounded-2xl border p-4 text-center transition-all ${
              active ? "border-2 border-primary bg-primary-soft" : "border-border hover:border-primary"
            }`}
          >
            <span className="absolute right-3 top-3">
              <CheckCircle active={active} />
            </span>
            <span className="block text-2xl">{opt.icon}</span>
            <span className={`mt-1.5 block text-sm font-bold ${active ? "text-primary" : "text-text"}`}>
              {opt.title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function ServiceBlocks({ section, state, set }) {
  const selected = state[section.forKey] || [];
  return (
    <div className="space-y-4">
      {section.blocks.map((block) => {
        const active = selected.includes(block.key);
        return (
          <div
            key={block.key}
            className={`overflow-hidden rounded-2xl border transition-all ${
              active ? "border-primary/40" : "border-border opacity-40"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-muted/60 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-bold text-text-strong">
                <span aria-hidden>{block.icon}</span> {block.title}
              </span>
              <span className={`text-xs font-semibold ${active ? "text-primary" : "text-subtle"}`}>
                {active ? "✓ Active" : "Select above to fill"}
              </span>
            </div>
            <div className={`space-y-4 p-4 ${active ? "" : "pointer-events-none select-none"}`}>
              {block.fields.map((f) => {
                if (f.kind === "chips") {
                  const cur = state[f.key] || [];
                  return (
                    <div key={f.key}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <div className="flex flex-wrap gap-2">
                        {f.options.map((c) => (
                          <Chip
                            key={c}
                            active={cur.includes(c)}
                            onClick={() =>
                              set(f.key, cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c])
                            }
                          >
                            {c}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (f.kind === "textarea") {
                  return (
                    <div key={f.key}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <textarea
                        value={state[f.key] || ""}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={2}
                        className="w-full rounded-xl border border-border-strong bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                      />
                    </div>
                  );
                }
                return null;
              })}
              {/* select fields render side-by-side under the chips/notes */}
              <div className="grid gap-3 sm:grid-cols-2">
                {block.fields
                  .filter((f) => f.kind === "select")
                  .map((f) => (
                    <div key={f.key}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <select
                        value={state[f.key] || ""}
                        onChange={(e) => set(f.key, e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Select…</option>
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OptionCards({ section, state, set }) {
  const selected = state[section.key] || "";
  return (
    <div>
      <div
        className={`grid gap-2.5 ${
          section.compact
            ? "grid-cols-3 sm:grid-cols-6"
            : section.horizontal
              ? "sm:grid-cols-2"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        }`}
      >
        {section.options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                set(section.key, active ? "" : opt.value);
                if (section.customInput) set(section.customInput.key, "");
              }}
              aria-pressed={active}
              className={`rounded-xl border p-3 transition-all ${
                section.horizontal ? "flex items-center gap-3 text-left" : "text-center"
              } ${active ? "border-2 border-primary bg-primary-soft" : "border-border hover:border-primary"}`}
            >
              <span className={section.compact ? "block text-base font-bold text-text" : "block text-2xl"}>
                {opt.icon}
              </span>
              <span className={section.horizontal ? "min-w-0 flex-1" : ""}>
                {!section.compact ? (
                  <span className={`mt-1 block text-sm font-bold ${active ? "text-primary" : "text-text"}`}>
                    {opt.value}
                  </span>
                ) : null}
                <span className="mt-0.5 block text-[11px] leading-snug text-muted">{opt.desc}</span>
              </span>
              {section.horizontal ? <CheckCircle active={active} /> : null}
            </button>
          );
        })}
      </div>
      {section.customInput ? (
        <div className="mt-3 max-w-xs">
          <FieldLabel>{section.customInput.label}</FieldLabel>
          <input
            type={section.customInput.type || "text"}
            min={50}
            value={state[section.customInput.key] || ""}
            onChange={(e) => {
              set(section.customInput.key, e.target.value);
              if (e.target.value) set(section.key, "");
            }}
            placeholder={section.customInput.placeholder}
            className={selectClass}
          />
        </div>
      ) : null}
    </div>
  );
}

const SECTION_RENDERERS = {
  destinationPicker: DestinationPicker,
  formGrid: FormGrid,
  checkCards: CheckCards,
  chipsWithText: ChipsWithText,
  serviceCards: ServiceCards,
  serviceBlocks: ServiceBlocks,
  optionCards: OptionCards,
};

/* ------------------------ message composition ---------------------- */

function lineFor(label, value) {
  if (value == null) return null;
  const v = Array.isArray(value) ? value.filter(Boolean).join(", ") : String(value).trim();
  return v ? `• ${label}: ${v}` : null;
}

function composeMessage(step, config, state, ref) {
  const lines = [`Hi MyShaadiStore! 👋 New ${step.title} request (Ref #${ref})`, ""];

  for (const section of config.sections) {
    if (section.type === "destinationPicker") {
      const mode = state[`${section.key}_mode`] || section.toggles[0].value;
      const dest = state[`${section.key}_choice`] || state[`${section.key}_other`];
      lines.push(lineFor("Travel type", mode), lineFor("Destination", dest));
    } else if (section.type === "formGrid") {
      for (const f of section.fields) lines.push(lineFor(f.label, state[f.key]));
    } else if (section.type === "checkCards") {
      lines.push(lineFor(section.title, state[section.key]));
      if (section.chipsKey) lines.push(lineFor(section.chipsLabel, state[section.chipsKey]));
    } else if (section.type === "chipsWithText") {
      lines.push(lineFor(section.title, state[section.key]));
      lines.push(lineFor("Notes", state[section.textKey]));
    } else if (section.type === "serviceCards") {
      const titles = (state[section.key] || [])
        .map((k) => section.options.find((o) => o.key === k)?.title)
        .filter(Boolean);
      lines.push(lineFor(section.title, titles));
    } else if (section.type === "serviceBlocks") {
      const selected = state[section.forKey] || [];
      for (const block of section.blocks) {
        if (!selected.includes(block.key)) continue;
        lines.push("", `${block.title}:`);
        for (const f of block.fields) lines.push(lineFor(f.label, state[f.key]));
      }
    } else if (section.type === "optionCards") {
      const custom = section.customInput ? state[section.customInput.key] : "";
      lines.push(lineFor(section.title, custom ? `${custom} (custom)` : state[section.key]));
    }
  }

  return lines.filter((l) => l !== null).join("\n");
}

function hasAnySelection(config, state) {
  return Object.values(state).some((v) =>
    Array.isArray(v) ? v.length > 0 : String(v || "").trim() !== "",
  );
}

/* ------------------------------ page ------------------------------- */

export default function JourneyEnquiryPage({ steps, step }) {
  const router = useRouter();
  const config = getEnquiryConfig(step.slug);
  const [state, setState] = useState({});
  const [submittedRef, setSubmittedRef] = useState("");

  const activeIndex = Math.max(0, steps.findIndex((s) => s.step_id === step.step_id));
  const prevStep = activeIndex > 0 ? steps[activeIndex - 1] : null;
  const nextStep = activeIndex < steps.length - 1 ? steps[activeIndex + 1] : null;

  const set = (key, value) => setState((prev) => ({ ...prev, [key]: value }));

  const summaryRows = useMemo(() => {
    if (!config?.summary) return [];
    return config.summary.rows.map((row) => ({
      ...row,
      value: row.get(state) || row.empty || "",
    }));
  }, [config, state]);

  if (!config) return null;

  function handleSubmit() {
    if (!hasAnySelection(config, state)) {
      toast.error("Select at least one option so we know what you need.");
      return;
    }
    const ref = `${config.submit.refPrefix}-${new Date().getFullYear()}-${String(
      Math.floor(1000 + Math.random() * 9000),
    )}`;
    const message = composeMessage(step, config, state, ref);
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    setSubmittedRef(ref);
  }

  return (
    <div className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-20">
      <JourneyStepStrip steps={steps} step={step} />

      {/* Hero badges (mockup trust pills) */}
      {config.heroBadges?.length ? (
        <div className="mx-auto -mt-2 mb-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {config.heroBadges.map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted"
            >
              <span aria-hidden>{b.icon}</span> {b.label}
            </span>
          ))}
        </div>
      ) : null}

      {submittedRef ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-[0_28px_60px_rgba(15,23,42,0.06)]">
          <CircleCheck className="mx-auto h-14 w-14 text-success" strokeWidth={1.5} />
          <h2 className="mt-4 text-xl font-bold text-text-strong">{config.submit.successTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {config.submit.successBody}
          </p>
          <p className="mt-5 inline-block rounded-xl bg-surface-muted px-5 py-2 text-sm font-bold text-primary">
            Ref #{submittedRef}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {nextStep ? (
              <button
                type="button"
                onClick={() => router.push(`/journey/${nextStep.slug}`)}
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Continue to {nextStep.title} →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/cart?tab=quotation")}
                className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Review quote basket
              </button>
            )}
            <button
              type="button"
              onClick={() => setSubmittedRef("")}
              className="h-11 rounded-xl border border-border-strong px-5 text-sm font-medium text-muted hover:bg-surface-muted"
            >
              Edit request
            </button>
          </div>
        </div>
      ) : (
        <JourneyStepNav
          prevHref={prevStep ? `/journey/${prevStep.slug}` : null}
          nextHref={nextStep ? `/journey/${nextStep.slug}` : "/cart?tab=quotation"}
          nextIsCart={!nextStep}
        >
          <div className="space-y-5">
          {config.sections.map((section, idx) => {
            const Renderer = SECTION_RENDERERS[section.type];
            if (!Renderer) return null;
            return (
              <SectionShell
                key={section.key || section.title}
                number={idx + 1}
                title={section.title}
                subtitle={section.subtitle}
              >
                <Renderer section={section} state={state} set={set} />
              </SectionShell>
            );
          })}

          {/* Live selection summary */}
          {config.summary ? (
            <div className="rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3">
              {config.summary.title ? (
                <p className="mb-2 text-sm font-bold text-primary">{config.summary.title}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {summaryRows.map((row, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <span aria-hidden>{row.icon}</span>
                    {row.label ? <span className="text-primary/70">{row.label}:</span> : null}
                    <strong className="font-bold">{row.value}</strong>
                  </span>
                ))}
              </div>
              {config.summary.footer ? (
                <p className="mt-2 text-[11px] text-primary/70">{config.summary.footer}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            className="h-13 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-[0_10px_24px_rgba(255,79,134,0.35)] transition-all hover:bg-primary-hover active:scale-[0.99]"
          >
            {config.submit.cta}
          </button>
          </div>
        </JourneyStepNav>
      )}
    </div>
  );
}
