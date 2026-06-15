"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";
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
  const triggerRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const listboxId = useId();

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
      const el = triggerRef.current;
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
    const source = state ? scoped : Array.from(new Set(Object.values(IN_CITIES_BY_STATE).flat()));
    // Clicking the control opens the full scoped list immediately; typing
    // narrows it. We filter on the live query only (not the committed city)
    // so an already-chosen city does not collapse the list to a single match.
    return filterOptions(source, cityQuery, 30);
  }, [state, cityQuery]);

  const stateOptions = useMemo(() => IN_STATES.map((s) => ({ value: s, label: s })), []);

  function emit(nextCity, nextState) {
    const payload = { city: normalizeText(nextCity), state: normalizeText(nextState) };
    payload.label = buildLocationLabel(payload.city, payload.state);
    onChange?.(payload);
  }

  return (
    <div ref={wrapRef} className={`w-full ${className}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Dropdown
            value={state}
            onChange={(nextState) => {
              setState(nextState);
              // Changing the state invalidates the previous city (city
              // options are scoped per state). Clear it so the user
              // re-picks a city that exists in the new state.
              setCity("");
              setCityQuery("");
              emit("", nextState);
            }}
            options={stateOptions}
            placeholder={placeholderState}
            ariaLabel="State"
            className="[&>button]:h-12 [&>button]:rounded-xl [&>button]:border-border-strong [&>button]:font-medium"
          />
        </div>

        <div className="relative space-y-1">
          {/* Searchable, library-backed city DROPDOWN. The trigger mirrors the
              state <Dropdown> (h-12, rounded-xl, border-border-strong, font-medium,
              focus ring + trailing chevron) so it reads as a real dropdown, while
              the embedded input keeps it a typeable combobox that allows free text. */}
          <div
            ref={triggerRef}
            className={`flex h-12 w-full items-center gap-2 rounded-xl border bg-surface px-4 text-sm font-medium transition
              ${open ? "border-primary ring-2 ring-primary/15" : "border-border-strong"}`}
            onMouseDown={() => {
              // Clicking anywhere on the control opens the full scoped list
              // immediately (no typing required) and focuses the input.
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
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
              placeholder={state ? "Choose a city" : placeholderCity}
              className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-subtle"
              required={required}
              aria-label="City"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={listboxId}
              autoComplete="off"
            />
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180 text-primary" : "text-subtle"}`}
            />
          </div>

          {open && cityOptions.length > 0 && menuStyle
            ? createPortal(
                <ul
                  id={listboxId}
                  role="listbox"
                  style={menuStyle}
                  className="dropdown-scroll overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
                >
                  {cityOptions.map((opt) => {
                    const isSel = normalizeText(opt).toLowerCase() === normalizeText(city).toLowerCase();
                    return (
                      <li
                        key={`${state || "any"}:${opt}`}
                        role="option"
                        aria-selected={isSel}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCity(opt);
                          setOpen(false);
                          setCityQuery("");
                          emit(opt, state);
                        }}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-primary-soft hover:text-primary
                          ${isSel ? "bg-primary-soft font-medium text-primary" : "text-text"}`}
                      >
                        <span className="flex min-w-0 items-center gap-2 truncate">
                          <span className="truncate">{opt}</span>
                          {state ? <span className="shrink-0 text-xs font-medium text-subtle">({state})</span> : null}
                        </span>
                        {isSel ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                      </li>
                    );
                  })}
                </ul>,
                document.body
              )
            : null}
        </div>
      </div>
    </div>
  );
}

