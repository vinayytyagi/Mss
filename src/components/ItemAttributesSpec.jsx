"use client";

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
 * Clean key → value rows (label muted on the left, value on the right),
 * grouped under a small section label, separated by hairline dividers.
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

function SpecRow({ field, value }) {
  const isUrl = field?.type === "url";
  const formatted = formatValue(field, value);
  if (formatted == null) return null;
  return (
    <div className="flex items-start justify-between gap-6 py-2.5">
      <dt className="text-sm text-muted">{field?.label || formatted}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-text">
        {isUrl ? (
          <a
            href={formatted}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            View&nbsp;↗
          </a>
        ) : (
          formatted
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

  // With schema: grouped sections with labels.
  if (schema?.attributes) {
    const groupsWithValues = groupFieldsBySection(schema)
      .map(([groupName, fields]) => [groupName, fields.filter((f) => hasValue(f.key))])
      .filter(([, fields]) => fields.length > 0);
    if (!groupsWithValues.length) return null;

    return (
      <div className="space-y-6">
        {groupsWithValues.map(([groupName, fields]) => (
          <div key={groupName}>
            <h4 className="mb-1 text-[11px] font-bold uppercase tracking-wide text-subtle">
              {groupName}
            </h4>
            <dl className="divide-y divide-border/70">
              {fields.map((f) => (
                <SpecRow key={f.key} field={f} value={attrs[f.key]} />
              ))}
            </dl>
          </div>
        ))}
      </div>
    );
  }

  // Fallback without schema: humanize the raw keys.
  const entries = Object.entries(attrs).filter(([key]) => hasValue(key));
  if (!entries.length) return null;
  return (
    <dl className="divide-y divide-border/70">
      {entries.map(([key, value]) => {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return <SpecRow key={key} field={{ label }} value={value} />;
      })}
    </dl>
  );
}
