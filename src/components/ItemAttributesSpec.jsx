"use client";

import { Info, Tag, Layers, Ruler, Sparkles, Package } from "lucide-react";

/**
 * Customer-facing "spec sheet" for an item.
 *
 * Renders item.attributes grouped by field.group from the per-journey-step
 * attribute schema (mss-admin/src/lib/itemAttributesSchema.js). The same
 * fields the vendor/admin filled in the item form show up here, so the
 * three apps stay in sync. Falls back gracefully when the schema isn't
 * available or the item has no attributes.
 *
 *   <ItemAttributesSpec item={item} schema={schema} />
 *
 * Styling uses the shared design tokens (text / muted / border / primary)
 * so it matches the rest of the product detail page.
 */

function formatValue(field, value) {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    const cleaned = value.filter((v) => v !== null && v !== undefined && v !== "");
    return cleaned.length ? cleaned.join(", ") : null;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field?.type === "money") {
    const n = Number(value);
    if (Number.isFinite(n)) return `₹${new Intl.NumberFormat("en-IN").format(n)}`;
  }
  return String(value);
}

// Pick a generic, on-brand icon for a group heading based on its name.
// Falls back to a neutral Info icon so every group reads consistently.
function iconForGroup(groupName) {
  const g = String(groupName || "").toLowerCase();
  if (/(dimension|size|measure|weight|length|width|height)/.test(g)) return Ruler;
  if (/(material|fabric|finish|style|design|look)/.test(g)) return Sparkles;
  if (/(category|type|tag|label|brand)/.test(g)) return Tag;
  if (/(package|content|include|kit|bundle|set)/.test(g)) return Package;
  if (/(spec|detail|feature|attribute|layer|variant)/.test(g)) return Layers;
  return Info;
}

function SpecRow({ field, value }) {
  const isUrl = field?.type === "url";
  const formatted = formatValue(field, value);
  if (formatted == null) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-sm text-muted">{field?.label || formatted}</dt>
      <dd className="text-right">
        {isUrl ? (
          <a
            href={formatted}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-primary-soft px-2 py-0.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            View&nbsp;↗
          </a>
        ) : (
          <span className="inline-block rounded-md bg-surface-muted px-2 py-0.5 text-sm font-semibold text-text">
            {formatted}
          </span>
        )}
      </dd>
    </div>
  );
}

function groupFieldsBySection(schema) {
  if (!schema?.attributes) return [];
  const groups = new Map();
  for (const f of schema.attributes) {
    const g = f.group || "Details";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(f);
  }
  return [...groups.entries()];
}

export default function ItemAttributesSpec({ item, schema }) {
  const attrs = item?.attributes || {};
  if (!attrs || Object.keys(attrs).length === 0) return null;

  const hasValue = (key) =>
    attrs[key] !== undefined &&
    attrs[key] !== null &&
    attrs[key] !== "" &&
    !(Array.isArray(attrs[key]) && attrs[key].length === 0);

  // With schema: render grouped sections with labels + help text.
  if (schema?.attributes) {
    const groupsWithValues = groupFieldsBySection(schema)
      .map(([groupName, fields]) => [groupName, fields.filter((f) => hasValue(f.key))])
      .filter(([, fields]) => fields.length > 0);
    if (!groupsWithValues.length) return null;

    return (
      <section className="space-y-8">
        {groupsWithValues.map(([groupName, fields]) => {
          const GroupIcon = iconForGroup(groupName);
          return (
            <div key={groupName}>
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                <GroupIcon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  {groupName}
                </h4>
              </div>
              <dl className="grid grid-cols-1 gap-x-10 gap-y-0.5 sm:grid-cols-2">
                {fields.map((f) => (
                  <SpecRow key={f.key} field={f} value={attrs[f.key]} />
                ))}
              </dl>
            </div>
          );
        })}
      </section>
    );
  }

  // Fallback without schema: humanize the raw keys.
  const entries = Object.entries(attrs).filter(([key]) => hasValue(key));
  if (!entries.length) return null;
  return (
    <section>
      <dl className="grid grid-cols-1 gap-x-10 gap-y-0.5 sm:grid-cols-2">
        {entries.map(([key, value]) => {
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return <SpecRow key={key} field={{ label }} value={value} />;
        })}
      </dl>
    </section>
  );
}
