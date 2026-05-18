"use client";

/**
 * Customer-facing "spec sheet" for an item.
 *
 * Renders item.attributes grouped by field.group from the per-journey-step
 * attribute schema. Falls back gracefully if the schema isn't available
 * or the item has no attributes.
 *
 * Use anywhere an item is shown in detail to the customer — works for
 * Venues, Catering, Photography, etc., not just Shopping.
 *
 *   <ItemAttributesSpec item={item} schema={schema} />
 *
 * `schema` is the per-step schema object (fetched from
 * `/api/v1/items/attribute-schema?stepSlug=...`).
 * If `schema` is not provided, falls back to displaying attribute keys
 * as plain text labels (less pretty but still informative).
 */

const HIDE_ALWAYS = new Set(["sample_menu_link", "portfolio_link", "sample_reel_link", "size_chart_link", "google_maps_link"]);

function formatValue(field, value) {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.join(", ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (field?.type === "money") {
    const n = Number(value);
    if (Number.isFinite(n)) return `₹${new Intl.NumberFormat("en-IN").format(n)}`;
  }
  if (field?.type === "url" || HIDE_ALWAYS.has(field?.key)) {
    // We render URLs as links below; return raw value so the renderer can wrap.
    return String(value);
  }
  return String(value);
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

  // With schema: render grouped sections with labels + help text.
  if (schema?.attributes) {
    const groups = groupFieldsBySection(schema);
    const groupsWithValues = groups
      .map(([groupName, fields]) => {
        const present = fields.filter((f) => attrs[f.key] !== undefined && attrs[f.key] !== null && attrs[f.key] !== "");
        return [groupName, present];
      })
      .filter(([, fields]) => fields.length > 0);
    if (!groupsWithValues.length) return null;

    return (
      <section className="space-y-5">
        <h3 className="text-lg font-semibold text-slate-900">Details</h3>
        {groupsWithValues.map(([groupName, fields]) => (
          <div key={groupName} className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">{groupName}</h4>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {fields.map((f) => {
                const v = attrs[f.key];
                const formatted = formatValue(f, v);
                if (formatted == null) return null;
                return (
                  <div key={f.key} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 py-1.5">
                    <dt className="text-sm text-slate-600">{f.label}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {f.type === "url" ? (
                        <a href={formatted} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline">
                          Open ↗
                        </a>
                      ) : (
                        formatted
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </section>
    );
  }

  // Fallback without schema: dump keys as-is (humanized).
  const entries = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-lg font-semibold text-slate-900">Details</h3>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {entries.map(([key, value]) => {
          const formatted = formatValue(null, value);
          if (formatted == null) return null;
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <div key={key} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 py-1.5">
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd className="text-sm font-medium text-slate-900">{formatted}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
