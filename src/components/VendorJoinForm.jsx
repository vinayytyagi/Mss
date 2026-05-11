"use client";

import { useEffect, useMemo, useState } from "react";
import { isValidEmail, isValidIndianPhone, normalizeIndianPhone } from "@/lib/authValidation";
const VENDOR_JOIN_EMAIL = "connect@myshaadistore.com";

const VENDOR_CATEGORIES = [
  "Venues",
  "Catering and Food Services",
  "Wedding Decor and Styling",
  "Photography and Videography",
  "Bridal and Groom Makeup and Styling",
  "Mehendi Artists",
  "Wedding Clothing",
  "Fashion Jewellery",
  "Entertainment and Performers",
  "Wedding Invitations",
  "Gifting",
  "Cakes and Desserts",
  "Wedding Rentals and Equipment",
  "Wedding Planning and Coordination",
  "Pre-Wedding Services (Photoshoot & More)",
  "Guest Management and Hospitality",
  "Ritual and Religious Services",
  "Honeymoon and Travel Services",
  "Beauty and Wellness Services",
  "Digital Wedding Services",
  "Post-Wedding Services",
];

function CategoryDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e) {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-category-dropdown]")) return;
      setOpen(false);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" data-category-dropdown>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 outline-none focus:border-[#ff4f86] focus:ring-4 focus:ring-[#ff4f86]/15"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || "Select a category"}
        </span>
        <span className="text-slate-500" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          className="mss-scrollbar-hidden absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
          role="listbox"
          aria-label="Category"
        >
          {VENDOR_CATEGORIES.map((c) => {
            const active = c === value;
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange?.(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between text-left rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-[#ff4f86]/10 text-[#b11257]" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{c}</span>
                {active ? (
                  <span className="text-[#ff4f86]" aria-hidden>
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function buildVendorJoinEmail(values) {
  const name = (values?.name || "-").trim() || "-";
  const business = (values?.business || "-").trim() || "-";
  const category = (values?.category || "-").trim() || "-";
  const city = (values?.city || "-").trim() || "-";
  const phone = values?.phone ? `+91 ${values.phone}` : "-";
  const email = (values?.email || "-").trim() || "-";
  const message = (values?.message || "").trim();

  const subjectBase = business !== "-" ? business : name !== "-" ? name : "New Vendor";
  const subject = `Join as Vendor — ${subjectBase}`;

  const bodyLines = [
    "Hello MyShaadiStore Team,",
    "",
    "I would like to join as a vendor. Please find my details below:",
    "",
    "Vendor Details",
    "----------------",
    `Name: ${name}`,
    `Business Name: ${business}`,
    `Category: ${category}`,
    `City: ${city}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
  ];

  if (message) {
    bodyLines.push("", "Additional Message", "----------------", message);
  }

  bodyLines.push("", "Regards,", name);

  return {
    to: VENDOR_JOIN_EMAIL,
    subject,
    body: bodyLines.join("\n"),
  };
}

function normalizeIndianMobile(value) {
  let digits = (value || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
  return normalizeIndianPhone(digits);
}

function validateVendorJoin(values) {
  const errors = {};

  const name = values?.name?.trim() || "";
  const phone = values?.phone?.trim() || "";
  const business = values?.business?.trim() || "";
  const category = values?.category?.trim() || "";
  const city = values?.city?.trim() || "";
  const email = values?.email?.trim() || "";
  const message = values?.message?.trim() || "";

  if (name.length < 2) errors.name = "Please enter your full name.";

  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!/^\d+$/.test(phone)) {
    errors.phone = "Only numbers are allowed.";
  } else if (!isValidIndianPhone(phone)) {
    errors.phone = "Enter a valid 10-digit mobile number starting with 6-9.";
  }

  if (business && business.length < 2) errors.business = "Business name looks too short.";
  if (!category) errors.category = "Please select a category.";
  if (city && city.length < 2) errors.city = "City looks too short.";

  if (email && !isValidEmail(email)) errors.email = "Please enter a valid email (e.g. name@company.com).";
  if (message.length > 700) errors.message = "Message is too long (max 700 characters).";

  return errors;
}

export default function VendorJoinForm({ showClose = false, onClose }) {
  const [values, setValues] = useState({
    name: "",
    business: "",
    category: "",
    city: "",
    phone: "",
    email: "",
    message: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    business: false,
    category: false,
    city: false,
    phone: false,
    email: false,
    message: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailDraft = useMemo(() => buildVendorJoinEmail(values), [values]);
  const errors = useMemo(() => validateVendorJoin(values), [values]);
  const canSend = useMemo(() => Object.keys(errors).length === 0, [errors]);

  function update(key) {
    return (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function showError(key) {
    return (submitAttempted || touched[key]) && errors[key];
  }

  function sendEmail() {
    setSubmitAttempted(true);
    if (!canSend) return;
    const subject = encodeURIComponent(emailDraft.subject || "");
    const body = encodeURIComponent(emailDraft.body || "");
    const url = `mailto:${emailDraft.to}?subject=${subject}&body=${body}`;
    window.location.href = url;
    onClose?.();
  }

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Join as vendor</h1>
          <p className="mt-1 text-sm text-slate-600">
            Fill your details and send us an email.
          </p>
        </div>
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Close"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Your name *</span>
          <input
            value={values.name}
            onChange={update("name")}
            onBlur={() => markTouched("name")}
            className={`h-11 rounded-xl border px-3 text-sm text-slate-900 outline-none focus:border-[#ff4f86] focus:ring-4 focus:ring-[#ff4f86]/15 ${
              showError("name") ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Full name"
          />
          {showError("name") ? (
            <span className="text-xs font-medium text-red-600">{errors.name}</span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Phone *</span>
          <div
            className={`flex h-11 items-center gap-2 rounded-xl border bg-white px-3 text-sm outline-none focus-within:border-[#ff4f86] focus-within:ring-4 focus-within:ring-[#ff4f86]/15 ${
              showError("phone") ? "border-red-300" : "border-slate-200"
            }`}
          >
            <span className="select-none text-slate-500">+91</span>
            <input
              value={values.phone}
              onChange={(e) => setField("phone", normalizeIndianMobile(e.target.value))}
              onBlur={() => markTouched("phone")}
              className="h-full w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="10 digit number"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
            />
          </div>
          {showError("phone") ? (
            <span className="text-xs font-medium text-red-600">{errors.phone}</span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Business name</span>
          <input
            value={values.business}
            onChange={update("business")}
            onBlur={() => markTouched("business")}
            className={`h-11 rounded-xl border px-3 text-sm text-slate-900 outline-none focus:border-[#ff4f86] focus:ring-4 focus:ring-[#ff4f86]/15 ${
              showError("business") ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Your brand / studio / shop"
          />
          {showError("business") ? (
            <span className="text-xs font-medium text-red-600">{errors.business}</span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Category *</span>
          <CategoryDropdown
            value={values.category}
            onChange={(v) => {
              setField("category", v);
              markTouched("category");
            }}
          />
          {showError("category") ? (
            <span className="text-xs font-medium text-red-600">{errors.category}</span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">City</span>
          <input
            value={values.city}
            onChange={update("city")}
            onBlur={() => markTouched("city")}
            className={`h-11 rounded-xl border px-3 text-sm text-slate-900 outline-none focus:border-[#ff4f86] focus:ring-4 focus:ring-[#ff4f86]/15 ${
              showError("city") ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Mumbai, Pune..."
          />
          {showError("city") ? (
            <span className="text-xs font-medium text-red-600">{errors.city}</span>
          ) : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-slate-600">Email</span>
          <input
            value={values.email}
            onChange={update("email")}
            onBlur={() => markTouched("email")}
            className={`h-11 rounded-xl border px-3 text-sm text-slate-900 outline-none focus:border-[#ff4f86] focus:ring-4 focus:ring-[#ff4f86]/15 ${
              showError("email") ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="name@company.com"
            inputMode="email"
          />
          {showError("email") ? (
            <span className="text-xs font-medium text-red-600">{errors.email}</span>
          ) : null}
        </label>
      </div>

      <label className="mt-4 grid gap-1">
        <span className="text-xs font-semibold text-slate-600">Message (optional)</span>
        <textarea
          value={values.message}
          onChange={update("message")}
          onBlur={() => markTouched("message")}
          className={`min-h-[96px] rounded-xl border p-3 text-sm text-slate-900 outline-none focus:border-[#ff4f86] focus:ring-4 focus:ring-[#ff4f86]/15 ${
            showError("message") ? "border-red-300" : "border-slate-200"
          }`}
          placeholder="Tell us about your services, coverage areas, price range, etc."
        />
        {showError("message") ? (
          <span className="text-xs font-medium text-red-600">{errors.message}</span>
        ) : null}
      </label>

      {!canSend ? (
        <p className="mt-4 text-xs font-medium text-slate-500">
          {submitAttempted ? "Please fix the highlighted fields to send." : "* Name and phone are required to send."}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={sendEmail}
          disabled={!canSend}
          className="h-11 w-full rounded-xl bg-[#ff4f86] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(255,79,134,0.28)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Send email
        </button>
      </div>
    </div>
  );
}
