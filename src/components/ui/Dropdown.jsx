"use client";

/**
 * Dropdown — a polished, accessible custom select to replace native <select>
 * across the customer app. Matches the design tokens (surface/border/primary)
 * and mirrors the clean admin Combobox aesthetic.
 *
 *   <Dropdown
 *     value={val}
 *     onChange={setVal}
 *     options={[{ value, label, icon? }]}
 *     placeholder="Choose…"
 *   />
 *
 * Keyboard: Enter/Space/ArrowDown opens; ArrowUp/Down move; Enter selects;
 * Esc closes. Closes on outside click. The menu is PORTALED to document.body
 * with position:fixed so it never gets clipped by overflow-hidden cards; it
 * flips above the trigger when there isn't enough room below.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const MENU_MAX_HEIGHT = 288; // matches max-h-72

export default function Dropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  className = "",
  disabled = false,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const opts = useMemo(() => (options || []).filter(Boolean), [options]);
  const selected = opts.find((o) => String(o.value) === String(value)) || null;

  // Position (and reposition) the portaled menu while open.
  useEffect(() => {
    if (!open) return;
    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const menuH = Math.min(MENU_MAX_HEIGHT, opts.length * 40 + 12 || 60);
      const flipUp = spaceBelow < menuH + 16 && r.top > spaceBelow;
      const maxHeight = flipUp
        ? Math.min(MENU_MAX_HEIGHT, Math.max(120, r.top - 16))
        : Math.min(MENU_MAX_HEIGHT, Math.max(120, spaceBelow - 16));
      setMenuStyle({
        position: "fixed",
        left: Math.max(8, r.left),
        width: r.width,
        maxHeight,
        zIndex: 9999,
        ...(flipUp
          ? { bottom: window.innerHeight - r.top + 6 }
          : { top: r.bottom + 6 }),
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, opts.length]);

  // Outside-click close — account for both the trigger and the portaled menu.
  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      const t = e.target;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      if (menuRef.current && menuRef.current.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function openMenu() {
    const i = opts.findIndex((o) => String(o.value) === String(value));
    setActiveIdx(i >= 0 ? i : 0);
    setOpen(true);
  }

  function choose(opt) {
    onChange?.(opt.value);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(opts.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (opts[activeIdx]) choose(opts[activeIdx]);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        onClick={() => !disabled && (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-surface px-3.5 text-sm font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition
          ${open ? "border-primary ring-2 ring-primary/15" : "border-border hover:border-primary/40"}
          ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className={`flex min-w-0 items-center gap-2 truncate ${selected ? "text-text" : "text-subtle"}`}>
          {selected?.icon ? <span className="shrink-0 text-muted">{selected.icon}</span> : null}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180 text-primary" : "text-subtle"}`}
        />
      </button>

      {open && menuStyle
        ? createPortal(
            <ul
              ref={menuRef}
              role="listbox"
              style={menuStyle}
              className="dropdown-scroll overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
            >
              {opts.length === 0 ? (
                <li className="px-3 py-2 text-sm text-subtle">No options</li>
              ) : (
                opts.map((o, i) => {
                  const isSel = String(o.value) === String(value);
                  const isActive = i === activeIdx;
                  return (
                    <li
                      key={`${o.value}-${i}`}
                      role="option"
                      aria-selected={isSel}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(o)}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition
                        ${isSel || isActive ? "bg-primary-soft text-primary" : "text-text"}
                        ${isSel ? "font-medium" : ""}`}
                    >
                      <span className="flex min-w-0 items-center gap-2 truncate">
                        {o.icon ? <span className="shrink-0 text-muted">{o.icon}</span> : null}
                        <span className="truncate">{o.label}</span>
                      </span>
                      {isSel ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
                    </li>
                  );
                })
              )}
            </ul>,
            document.body
          )
        : null}
    </div>
  );
}
