"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IN_CITIES_BY_STATE,
  IN_STATES,
  buildLocationLabel,
  normalizeText,
  parseLocationLabel,
} from "@/lib/indiaLocations";

function filterOptions(options, query, limit = 30) {
  const q = normalizeText(query).toLowerCase();
  const list = Array.isArray(options) ? options : [];
  if (!q) return list.slice(0, limit);
  const starts = [];
  const contains = [];
  for (const opt of list) {
    const t = String(opt || "").toLowerCase();
    if (!t) continue;
    if (t.startsWith(q)) starts.push(opt);
    else if (t.includes(q)) contains.push(opt);
    if (starts.length + contains.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/**
 * Searchable City+State dropdown.
 *
 * - **Controlled output**: calls `onChange({ city, state, label })`
 * - Allows free text city even if not in list.
 */
export default function CityStateDropdown({
  value,
  cityValue,
  stateValue,
  onChange,
  placeholderCity = "Search city…",
  placeholderState = "Select state",
  required = false,
  className = "",
}) {
  const parsed = useMemo(() => {
    if (cityValue !== undefined || stateValue !== undefined) {
      const city = normalizeText(cityValue);
      const state = normalizeText(stateValue);
      return { city, state, label: buildLocationLabel(city, state) };
    }
    const { city, state } = parseLocationLabel(value);
    return { city, state, label: buildLocationLabel(city, state) };
  }, [value, cityValue, stateValue]);

  const [state, setState] = useState(parsed.state);
  const [city, setCity] = useState(parsed.city);
  const [cityQuery, setCityQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [lastSyncedKey, setLastSyncedKey] = useState(`${parsed.state}|${parsed.city}`);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  // Sync internal inputs when parent-supplied value changes (e.g., DB hydration /
  // Back navigation). Adjust during render per React 19 docs to avoid a setState-in-effect.
  const incomingKey = `${parsed.state}|${parsed.city}`;
  if (incomingKey !== lastSyncedKey) {
    setLastSyncedKey(incomingKey);
    setState(parsed.state);
    setCity(parsed.city);
  }

  useEffect(() => {
    if (!open) return;
    function update() {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const maxHeight = Math.min(320, Math.max(180, window.innerHeight - r.bottom - 16));
      setMenuStyle({
        position: "fixed",
        left: Math.max(8, r.left),
        top: Math.min(window.innerHeight - 8, r.bottom + 8),
        width: Math.max(240, r.width),
        maxHeight,
        zIndex: 9999,
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const cityOptions = useMemo(() => {
    const scoped = state ? (IN_CITIES_BY_STATE[state] || []) : [];
    const fallback = state ? scoped : Array.from(new Set(Object.values(IN_CITIES_BY_STATE).flat()));
    return filterOptions(fallback, cityQuery || city, 30);
  }, [state, cityQuery, city]);

  function emit(nextCity, nextState) {
    const payload = { city: normalizeText(nextCity), state: normalizeText(nextState) };
    payload.label = buildLocationLabel(payload.city, payload.state);
    onChange?.(payload);
  }

  return (
    <div ref={wrapRef} className={`w-full ${className}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <select
            value={state}
            onChange={(e) => {
              const nextState = e.target.value;
              setState(nextState);
              // Changing the state invalidates the previous city (city
              // options are scoped per state). Clear it so the user
              // re-picks a city that exists in the new state.
              setCity("");
              setCityQuery("");
              emit("", nextState);
            }}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            required={required}
            aria-label="State"
          >
            <option value="">{placeholderState}</option>
            {IN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="relative space-y-1">
          <input
            ref={inputRef}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setCityQuery(e.target.value);
              setOpen(true);
              emit(e.target.value, state);
            }}
            onFocus={() => setOpen(true)}
            onBlur={(e) => {
              // allow click selection from dropdown
              const next = e.relatedTarget;
              if (wrapRef.current && next && wrapRef.current.contains(next)) return;
              setOpen(false);
              setCityQuery("");
            }}
            placeholder={placeholderCity}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            required={required}
            aria-label="City"
          />

          {open && cityOptions.length > 0 && menuStyle
            ? createPortal(
                <div
                  style={menuStyle}
                  className="overflow-auto rounded-2xl border border-border bg-surface p-1 shadow-[0_18px_60px_rgba(15,23,42,0.16)]"
                >
                  {cityOptions.map((opt) => (
                    <button
                      key={`${state || "any"}:${opt}`}
                      type="button"
                      className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold text-text transition hover:bg-primary-soft hover:text-primary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCity(opt);
                        setOpen(false);
                        setCityQuery("");
                        emit(opt, state);
                      }}
                    >
                      {opt}
                      {state ? <span className="ml-2 text-xs font-medium text-subtle">({state})</span> : null}
                    </button>
                  ))}
                </div>,
                document.body
              )
            : null}
        </div>
      </div>
    </div>
  );
}

