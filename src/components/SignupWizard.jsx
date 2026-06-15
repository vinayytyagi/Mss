"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthScene from "@/components/AuthScene";
import CityStateDropdown from "@/components/CityStateDropdown";
import { getAuthToken, getAuthUser, saveAuthCookies } from "@/lib/authCookies";
import { fetchBudgetPresets, fetchJourneySteps, registerWithPhonePassword } from "@/lib/api";
import { fetchMyProfile, updateMyProfile } from "@/lib/api/userApi";
import { isValidEmail, isValidIndianPhone, normalizeIndianPhone, validatePasswordStrength } from "@/lib/authValidation";
import { makeIdempotencyKey } from "@/lib/idempotencyKey";
import { toast } from "sonner";

const MAX_BUDGET_PER_STEP = 10000000;

const SIGNUP_STATE_KEY = "mss:signupWizard:v2";
const SIGNUP_STATE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const STEP_TO_PATH = {
  signup: "/signup",
  password: "/signup/password",
  engaged: "/signup/engaged",
  date: "/signup/date",
  venue: "/signup/venue",
  "groom-bride": "/signup/groom-bride",
  days: "/signup/days",
  guests: "/signup/guests",
  budget: "/signup/budget",
};

// Maps backend's current_step keys to route step keys above.
const DB_STEP_TO_ROUTE_STEP = {
  engagement: "engaged",
  weddingDate: "date",
  venue: "venue",
  groomBride: "groom-bride",
  functionDays: "days",
  guests: "guests",
  budget: "budget",
  done: null,
};

function dbStepToPath(dbStep) {
  const routeStep = DB_STEP_TO_ROUTE_STEP[dbStep];
  return routeStep ? STEP_TO_PATH[routeStep] : null;
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadState() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SIGNUP_STATE_KEY);
  const v = safeJsonParse(raw);
  if (!v || typeof v !== "object") return null;
  if (!v.savedAt || Date.now() - Number(v.savedAt) > SIGNUP_STATE_TTL_MS) return null;
  return v;
}

function saveState(next) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SIGNUP_STATE_KEY, JSON.stringify({ ...next, savedAt: Date.now() }));
}

function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SIGNUP_STATE_KEY);
}

function computeDbResumePath(user) {
  const rootProgress = String(user?.onboarding_progress?.current_step || "").trim();
  const mapped = dbStepToPath(rootProgress);
  if (mapped) return mapped;
  // fallback: derive from onboarding fields
  const o = user?.onboarding || {};
  const engagement = String(o.engagement_status || "").trim();
  if (!engagement) return "/signup/engaged";
  const weddingType = String(o.wedding_date_type || "").trim();
  if (!weddingType) return "/signup/date";
  if (weddingType === "exact" && !String(o.wedding_date || "").trim()) return "/signup/date";
  if (weddingType === "month" && !String(o.wedding_month || "").trim()) return "/signup/date";
  if (!String(o.venue_location || "").trim()) return "/signup/venue";
  if (!String(o.groom_or_bride || "").trim()) return "/signup/groom-bride";
  if (!(Number(o.function_days) > 0)) return "/signup/days";
  if (!(Number(o.guests_count) > 0)) return "/signup/guests";
  const allocs = Array.isArray(o.budget_allocations) ? o.budget_allocations : [];
  if (allocs.length === 0) return "/signup/budget";
  return null;
}

function trimSignupEmail(raw) {
  const t = String(raw || "").trim();
  return t || null;
}

function trimSignupName(raw) {
  return String(raw || "").trim();
}

export default function SignupWizard({ step }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // Pick up a `?redirect=…` if the user landed here from a gated page
  // (e.g. /cart). On successful registration we send them there instead
  // of the default /journey/venue. We also propagate it on the back-to-
  // login link so the round-trip survives a mid-signup change of mind.
  const redirectTo = searchParams.get("redirect") || searchParams.get("returnTo") || "";
  const loginHref = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";
  const [form, setForm] = useState(() => {
    const defaults = {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      engagement_status: "yes",
      wedding_date_type: "exact",
      wedding_date: "",
      wedding_month: "",
      venue_location: "",
      groom_or_bride: "",
      function_days: "",
      guests_count: "",
    };
    if (typeof window === "undefined") return defaults;
    const token = getAuthToken();
    const user = getAuthUser();
    if (token && user) {
      const o = user?.onboarding || {};
      return {
        ...defaults,
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        engagement_status: o.engagement_status ?? defaults.engagement_status,
        wedding_date_type: o.wedding_date_type ?? defaults.wedding_date_type,
        wedding_date: o.wedding_date ?? defaults.wedding_date,
        wedding_month: o.wedding_month ?? defaults.wedding_month,
        venue_location: o.venue_location ?? defaults.venue_location,
        groom_or_bride: o.groom_or_bride ?? defaults.groom_or_bride,
        function_days: o.function_days != null ? String(o.function_days) : defaults.function_days,
        guests_count: o.guests_count != null ? String(o.guests_count) : defaults.guests_count,
      };
    }
    const cached = loadState();
    if (cached?.form) {
      return {
        ...defaults,
        ...cached.form,
        password: "",
        confirmPassword: "",
      };
    }
    return defaults;
  });

  const [budgetAllocations, setBudgetAllocations] = useState(() => {
    if (typeof window === "undefined") return [];
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) return [];
    const allocs = Array.isArray(user?.onboarding?.budget_allocations) ? user.onboarding.budget_allocations : [];
    return allocs.map((a) => ({
      step_id: a.step_id,
      slug: a.slug,
      title: a.title,
      amount: Number(a.amount) || 0,
      min_budget: Math.max(Number(a.min_budget) || 0, 0),
      max_budget: Math.max(Number(a.max_budget) || 0, Number(a.amount) || 0, 500000),
      blurb: String(a.blurb || ""),
    }));
  });

  const [budgetPresets, setBudgetPresets] = useState([]);
  const [selectedPresetSlug, setSelectedPresetSlug] = useState(() => {
    if (typeof window === "undefined") return null;
    const user = getAuthUser();
    const slug = user?.onboarding?.budget_preset_slug;
    return slug || null;
  });
  const totalAllocated = useMemo(
    () => budgetAllocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [budgetAllocations]
  );

  function updateBudgetAmount(index, raw) {
    const cleaned = String(raw || "").replace(/[^\d]/g, "");
    setBudgetAllocations((prev) => {
      const next = [...prev];
      const entry = next[index];
      if (!entry) return prev;
      const minBudget = Math.max(Number(entry.min_budget) || 0, 0);
      const maxBudget = Math.max(Number(entry.max_budget) || 0, Number(entry.amount) || 0, 500000);
      const raw_n = Number(cleaned || 0);
      const amount = Math.max(minBudget, Math.min(maxBudget || MAX_BUDGET_PER_STEP, raw_n));
      next[index] = { ...entry, amount };
      return next;
    });
  }

  function applyPreset(presetSlug) {
    const preset = budgetPresets.find((p) => p.slug === presetSlug);
    if (!preset) return;
    setSelectedPresetSlug(presetSlug);
    const allocByStepId = new Map();
    for (const a of preset.allocations || []) {
      if (a?.step_id) allocByStepId.set(String(a.step_id), a);
    }
    setBudgetAllocations((prev) =>
      prev.map((entry) => {
        const presetAlloc = allocByStepId.get(String(entry.step_id));
        if (!presetAlloc) return entry;
        const min_budget = Math.max(Number(presetAlloc.min_amount) || 0, 0);
        const max_budget = Math.max(
          Number(presetAlloc.max_amount) || 0,
          Number(entry.max_budget) || 0,
          min_budget,
        );
        const amount = Math.max(min_budget, Math.min(max_budget, Number(presetAlloc.amount) || 0));
        return {
          ...entry,
          amount,
          min_budget,
          max_budget,
          blurb: presetAlloc.blurb || entry.blurb || "",
        };
      }),
    );
    // Auto-bump guests_count to the preset's lower bound if not already set
    setForm((f) => {
      const currentGuests = Number(f.guests_count) || 0;
      if (currentGuests > 0) return f;
      const min = Number(preset.min_guests) || 0;
      if (min <= 0) return f;
      return { ...f, guests_count: String(min) };
    });
  }

  const stepLabels = useMemo(
    () => ["Engagement", "Date", "Venue", "Groom/Bride", "Function Days", "Guests", "Budget"],
    [],
  );
  const showStepper = useMemo(() => {
    return (
      step === "engaged" ||
      step === "date" ||
      step === "venue" ||
      step === "groom-bride" ||
      step === "days" ||
      step === "guests" ||
      step === "budget"
    );
  }, [step]);
  const activeStep = useMemo(() => {
    const map = {
      engaged: 0,
      date: 1,
      venue: 2,
      "groom-bride": 3,
      days: 4,
      guests: 5,
      budget: 6,
    };
    return map[step] ?? 0;
  }, [step]);

  // Restore local wizard state (no passwords)
  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();
    if (token && user) {
      setHydrated(true);
      return;
    }
    const cached = loadState();
    if (cached?.form) {
      setForm((f) => ({
        ...f,
        ...cached.form,
        password: "",
        confirmPassword: "",
      }));
    }
    if (Array.isArray(cached?.budgetAllocations)) setBudgetAllocations(cached.budgetAllocations);
    setHydrated(true);
  }, []);

  // When logged in, hydrate the form from DB-saved onboarding so BACK shows saved values.
  useEffect(() => {
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) return;

    let ignore = false;
    (async () => {
      try {
        const profile = await fetchMyProfile(token);
        if (ignore) return;
        const u = profile && typeof profile === "object" && profile.user != null ? profile.user : profile;
        const onboarding = u?.onboarding || {};
        setForm((f) => ({
          ...f,
          name: u?.name || f.name,
          email: u?.email || f.email,
          phone: u?.phone || f.phone,
          engagement_status: onboarding.engagement_status ?? f.engagement_status,
          wedding_date_type: onboarding.wedding_date_type ?? f.wedding_date_type,
          wedding_date: onboarding.wedding_date ?? f.wedding_date,
          wedding_month: onboarding.wedding_month ?? f.wedding_month,
          venue_location: onboarding.venue_location ?? f.venue_location,
          groom_or_bride: onboarding.groom_or_bride ?? f.groom_or_bride,
          function_days:
            onboarding.function_days !== undefined && onboarding.function_days !== null
              ? String(onboarding.function_days)
              : f.function_days,
          guests_count:
            onboarding.guests_count !== undefined && onboarding.guests_count !== null
              ? String(onboarding.guests_count)
              : f.guests_count,
        }));
        if (Array.isArray(onboarding.budget_allocations)) {
          setBudgetAllocations(onboarding.budget_allocations);
        }
        // keep cookie user fresh as well
        if (u) saveAuthCookies({ token, user: u });
      } catch {
        // ignore; user may continue with cookie snapshot
      }
    })();

    return () => {
      ignore = true;
    };
  }, [step]);

  // Ensure budget step shows ALL journey steps (build allocations when empty).
  useEffect(() => {
    if (step !== "budget") return;
    if (budgetAllocations.length > 0) return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetchJourneySteps();
        if (ignore) return;
        const steps = Array.isArray(res?.steps) ? res.steps : Array.isArray(res) ? res : [];
        const sorted = [...steps].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        setBudgetAllocations(
          sorted.map((s) => ({
            step_id: s._id || s.step_id || s.slug,
            slug: s.slug,
            title: s.title || s.slug,
            amount: Number(s.default_budget) || 0,
            min_budget: 0,
            max_budget: Math.max(Number(s.max_budget) || 0, Number(s.default_budget) || 0, 500000),
            blurb: "",
          }))
        );
      } catch {
        // ignore
      }
    })();
    return () => {
      ignore = true;
    };
  }, [step, budgetAllocations.length]);

  // Load admin-configured budget presets when the user reaches the budget step.
  useEffect(() => {
    if (step !== "budget") return;
    let ignore = false;
    (async () => {
      try {
        const res = await fetchBudgetPresets();
        if (ignore) return;
        const presets = Array.isArray(res?.presets) ? res.presets : Array.isArray(res) ? res : [];
        setBudgetPresets(presets);
      } catch {
        // ignore — page still works without presets, sliders just won't be pre-filled
      }
    })();
    return () => {
      ignore = true;
    };
  }, [step]);

  // Only show presets whose guest range covers the user's expected count.
  // If the user's count falls outside every preset's range, we fall back to
  // showing all presets so the customer is never stuck with zero options.
  const userGuestsCount = Number(form.guests_count) || 0;
  const visibleBudgetPresets = useMemo(() => {
    if (!userGuestsCount) return budgetPresets;
    const matches = budgetPresets.filter((p) => {
      const lo = Number(p.min_guests) || 0;
      const hi = Number(p.max_guests) || Number.POSITIVE_INFINITY;
      return userGuestsCount >= lo && userGuestsCount <= hi;
    });
    return matches.length > 0 ? matches : budgetPresets;
  }, [budgetPresets, userGuestsCount]);

  // Auto-pick a preset:
  //  - First visit / no prior selection → pre-select the first visible preset
  //    (presets are already sorted by display_order by the API).
  //  - User changes their guest count and the previously-picked preset is no
  //    longer in the visible list → swap to the new first visible preset.
  // Manual chip taps always win — once a visible preset is selected, this
  // effect leaves it alone.
  useEffect(() => {
    if (step !== "budget") return;
    if (visibleBudgetPresets.length === 0) return;
    if (budgetAllocations.length === 0) return;
    const isStillVisible =
      selectedPresetSlug &&
      visibleBudgetPresets.some((p) => p.slug === selectedPresetSlug);
    if (isStillVisible) return;
    applyPreset(visibleBudgetPresets[0].slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, visibleBudgetPresets, budgetAllocations.length, selectedPresetSlug]);

  // Persist local wizard state (never store passwords). Skip until hydrated so we
  // don't overwrite localStorage with the empty first-paint form on /signup/password.
  useEffect(() => {
    if (!hydrated) return;
    const token = getAuthToken();
    const user = getAuthUser();
    if (token && user) return;
    const persisted = { ...form };
    delete persisted.password;
    delete persisted.confirmPassword;
    saveState({
      form: persisted,
      budgetAllocations,
    });
  }, [form, budgetAllocations, hydrated]);

  // If logged in, route-resume from DB (production approach)
  useEffect(() => {
    try {
      const token = getAuthToken();
      const user = getAuthUser();
      if (!token || !user) return;
      // Allow users to go BACK/forward manually within onboarding screens.
      // Only auto-resume from the first signup screen (not /signup/password — new users have no token).
      const isEntryStep = step === "signup";
      if (!isEntryStep) return;
      if (user?.onboarding?.engagement_status === "just_exploring") {
        router.replace("/shopping");
        return;
      }
      const resumePath = computeDbResumePath(user);
      if (resumePath) {
        router.replace(resumePath);
        return;
      }
      // Onboarding complete
      router.replace("/");
    } catch {
      // ignore
    }
  }, [router, step]);

  function goto(path) {
    router.push(path);
  }

  function handleSignupDetailsNext(e) {
    e.preventDefault();
    try {
      const name = trimSignupName(form.name);
      if (!name) {
        toast.error("Name is required.");
        return;
      }
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        toast.error("Enter a valid 10-digit Indian phone number.");
        return;
      }
      const email = trimSignupEmail(form.email);
      if (email && !isValidEmail(email)) {
        toast.error("Enter a valid email address (or leave it blank).");
        return;
      }
      saveState({
        form: {
          ...form,
          phone,
          name: form.name,
          email: form.email,
          password: "",
          confirmPassword: "",
        },
        budgetAllocations,
      });
      goto(STEP_TO_PATH.password);
    } catch {
      toast.error("Something went wrong.");
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const name = trimSignupName(form.name);
      if (!name) throw new Error("Name is required.");
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        toast.error("Phone number is missing. Please complete sign up from the beginning.");
        router.replace(STEP_TO_PATH.signup);
        return;
      }
      const passwordError = validatePasswordStrength(form.password);
      if (passwordError) throw new Error(passwordError);
      if (form.password !== form.confirmPassword) throw new Error("Passwords do not match.");

      const idempotencyKey = makeIdempotencyKey("auth/register-phone", { phone, name });
      const data = await registerWithPhonePassword(
        {
          name,
          phone,
          password: form.password,
          email: trimSignupEmail(form.email),
        },
        { idempotencyKey }
      );
      if (data?.token && data?.user) {
        saveAuthCookies({ token: data.token, user: data.user });
      }
      clearState();
      toast.success("Account created.");
      // Step the new user through the onboarding wizard
      // (engagement → date → venue → groom-bride → days → guests → budget).
      // The `redirectTo` query param is preserved on the wizard state so
      // the final budget step can honour it once onboarding completes.
      goto(STEP_TO_PATH.engaged);
    } catch (err) {
      toast.error(err?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAfterLogin(nextDbStep, onboardingPatch) {
    const token = getAuthToken();
    if (!token) {
      const returnTo = redirectTo || STEP_TO_PATH[step] || "/signup/engaged";
      toast.error("Login required to continue onboarding.");
      router.replace(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return false;
    }

    setLoading(true);
    try {
      const user = getAuthUser();
      const nextOnboarding = { ...(user?.onboarding || {}), ...onboardingPatch };
      const res = await updateMyProfile(token, {
        onboarding: nextOnboarding,
        onboarding_progress: { current_step: nextDbStep, updated_at: new Date().toISOString() },
      });
      // Keep cookie user in sync
      saveAuthCookies({ token, user: res.user });
      return true;
    } catch (err) {
      toast.error(err?.message || "Failed to save progress.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  const todayIso = new Date().toISOString().split("T")[0];
  const currentMonthIso = todayIso.slice(0, 7);

  useEffect(() => {
    if (step === "otp") router.replace("/signup");
  }, [step, router]);

  useEffect(() => {
    if (step !== "password") return;
    if (!hydrated) return;
    const phone = normalizeIndianPhone(form.phone);
    if (!isValidIndianPhone(phone)) router.replace(STEP_TO_PATH.signup);
  }, [step, hydrated, form.phone, router]);

  // -------- UI per route step --------

  if (step === "signup") {
    return (
      <AuthScene
        title="Plan Your Dream Wedding"
        subtitle="Enter your details first — you will set your password on the next step. No OTP."
        variant={0}
      >
        <form className="space-y-5" noValidate onSubmit={handleSignupDetailsNext}>
          <input
            type="text"
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            required
          />
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
          />
          <div className="relative flex items-center">
            <span className="absolute left-6 text-md font-semibold text-subtle">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: normalizeIndianPhone(e.target.value) }))}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface pl-14 pr-4 text-sm font-medium text-text outline-none transition focus:border-primary"
              required
            />
          </div>
          <button type="submit" className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover">
            Continue
          </button>
          <p className="text-center text-sm text-muted">
            Already a user?{" "}
            <Link href={loginHref} className="font-semibold text-primary underline underline-offset-4">
              Login
            </Link>
          </p>
        </form>
      </AuthScene>
    );
  }

  if (step === "password") {
    return (
      <AuthScene
        title="Set your password"
        subtitle={`Create a password for +91 ${normalizeIndianPhone(form.phone) || "your mobile"}.`}
        variant={2}
      >
        <form className="space-y-5" noValidate onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            required
            autoComplete="new-password"
          />
          <p className="text-xs leading-relaxed text-muted">
            Password must be 8+ characters with upper, lower, number, and a special character.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.signup)}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      </AuthScene>
    );
  }

  if (step === "engaged") {
    return (
      <AuthScene
        title="Are you engaged?"
        subtitle="This helps personalize your wedding journey."
        variant={3}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          {[
            ["yes", "Yes", "We're engaged"],
            ["getting_engaged_soon", "Getting Engaged Soon", "Planning the proposal"],
            ["just_exploring", "Just exploring", "Looking around"],
          ].map(([value, title, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, engagement_status: value }))}
              className={`w-full cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                form.engagement_status === value
                  ? "border-primary-accent bg-surface shadow-[0_10px_24px_rgba(255,79,134,0.08)]"
                  : "border-border-strong bg-surface/70"
              }`}
            >
              <div className="text-base font-semibold text-text">{title}</div>
              <div className="mt-1 text-sm text-muted">{text}</div>
            </button>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => router.back()}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted disabled:opacity-60"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const ok = await saveAfterLogin("weddingDate", { engagement_status: form.engagement_status });
                if (!ok) return;
                if (form.engagement_status === "just_exploring") {
                  router.push("/shopping");
                  return;
                }
                goto(STEP_TO_PATH.date);
              }}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "date") {
    return (
      <AuthScene
        title="When is your big day?"
        subtitle="Choose the timing that fits your planning stage."
        variant={4}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          {[
            ["exact", "I have an exact date"],
            ["month", "I know the month"],
            ["not_decided", "Not decided yet"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, wedding_date_type: value }))}
              className={`w-full cursor-pointer rounded-xl border px-4 py-4 text-left text-base font-semibold transition ${
                form.wedding_date_type === value
                  ? "border-primary-accent bg-surface"
                  : "border-border-strong bg-surface/70 text-muted"
              }`}
            >
              {label}
            </button>
          ))}

          {form.wedding_date_type === "exact" ? (
            <input
              type="date"
              min={todayIso}
              value={form.wedding_date}
              onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            />
          ) : null}

          {form.wedding_date_type === "month" ? (
            <input
              type="month"
              min={currentMonthIso}
              value={form.wedding_month}
              onChange={(e) => setForm((f) => ({ ...f, wedding_month: e.target.value }))}
              className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
            />
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.engaged)}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (form.wedding_date_type === "exact" && !form.wedding_date) {
                  toast.error("Please select your wedding date.");
                  return;
                }
                if (form.wedding_date_type === "month" && !form.wedding_month) {
                  toast.error("Please select your wedding month.");
                  return;
                }
                const patch = {
                  wedding_date_type: form.wedding_date_type,
                  wedding_date: form.wedding_date_type === "exact" ? (form.wedding_date || null) : null,
                  wedding_month: form.wedding_date_type === "month" ? (form.wedding_month || null) : null,
                };
                const ok = await saveAfterLogin("venue", patch);
                if (!ok) return;
                goto(STEP_TO_PATH.venue);
              }}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "venue") {
    return (
      <AuthScene
        title="Where is your venue?"
        subtitle="Venue location helps personalize recommendations."
        variant={5}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          <CityStateDropdown
            value={form.venue_location}
            onChange={(loc) => setForm((f) => ({ ...f, venue_location: loc.label }))}
            placeholderCity="Search venue city…"
            placeholderState="Select state"
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.date)}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (!String(form.venue_location || "").trim()) {
                  toast.error("Please enter your venue location.");
                  return;
                }
                const ok = await saveAfterLogin("groomBride", { venue_location: form.venue_location || null });
                if (!ok) return;
                goto(STEP_TO_PATH["groom-bride"]);
              }}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "groom-bride") {
    return (
      <AuthScene
        title="Groom or Bride?"
        subtitle="This helps personalize your wedding journey."
        variant={6}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          {[
            ["groom", "Groom", "I'm the groom"],
            ["bride", "Bride", "I'm the bride"],
          ].map(([value, title, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, groom_or_bride: value }))}
              className={`w-full cursor-pointer rounded-xl border px-4 py-4 text-left transition ${
                form.groom_or_bride === value
                  ? "border-primary-accent bg-surface shadow-[0_10px_24px_rgba(255,79,134,0.08)]"
                  : "border-border-strong bg-surface/70"
              }`}
            >
              <div className="text-base font-semibold text-text">{title}</div>
              <div className="mt-1 text-sm text-muted">{text}</div>
            </button>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.venue)}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (!form.groom_or_bride) {
                  toast.error("Please select groom or bride.");
                  return;
                }
                const ok = await saveAfterLogin("functionDays", { groom_or_bride: form.groom_or_bride || null });
                if (!ok) return;
                goto(STEP_TO_PATH.days);
              }}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "days") {
    return (
      <AuthScene
        title="How many days is your function?"
        subtitle="Helps with planning and suggestions."
        variant={7}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          <input
            type="number"
            min="1"
            placeholder="e.g. 2"
            value={form.function_days}
            onChange={(e) => setForm((f) => ({ ...f, function_days: e.target.value }))}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH["groom-bride"])}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const days = Number(form.function_days);
                if (!days || days <= 0) {
                  toast.error("Please enter number of function days.");
                  return;
                }
                const ok = await saveAfterLogin("guests", { function_days: days });
                if (!ok) return;
                goto(STEP_TO_PATH.guests);
              }}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "guests") {
    return (
      <AuthScene
        title="How many guests?"
        subtitle="Guest count helps refine suggestions."
        variant={8}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          <input
            type="number"
            min="1"
            placeholder="e.g. 300"
            value={form.guests_count}
            onChange={(e) => setForm((f) => ({ ...f, guests_count: e.target.value }))}
            className="h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.days)}
              className="h-11 flex-1 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const guests = Number(form.guests_count);
                if (!guests || guests <= 0) {
                  toast.error("Please enter expected guest count.");
                  return;
                }
                const ok = await saveAfterLogin("budget", { guests_count: guests });
                if (!ok) return;
                goto(STEP_TO_PATH.budget);
              }}
              className="h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "budget") {
    const formatBudget = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
    async function persistBudget(nextDbStep) {
      return saveAfterLogin(nextDbStep, {
        budget_total: totalAllocated,
        budget_preset_slug: selectedPresetSlug || null,
        budget_allocations: budgetAllocations.map((item) => ({
          step_id: item.step_id,
          slug: item.slug,
          title: item.title,
          amount: Number(item.amount) || 0,
          min_budget: Number(item.min_budget) || 0,
          max_budget: Number(item.max_budget) || MAX_BUDGET_PER_STEP,
          blurb: item.blurb || "",
        })),
      });
    }
    async function finishBudget() {
      const ok = await persistBudget("done");
      if (!ok) return;
      clearState();
      router.push(redirectTo || "/journey/venue");
    }
    return (
      <AuthScene
        title="Budget planner"
        subtitle="Set your estimated budget step-by-step."
        variant={9}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-6">
          {/* Quick-start preset chips — single-row horizontal carousel.
              Chips don't shrink; the row scrolls if they overflow. Only
              presets whose guest range covers the user's count appear. */}
          {visibleBudgetPresets.length > 0 && (
            <div>
              <div className="mb-2.5 flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  Quick start
                </span>
                <span className="text-[11px] font-medium text-subtle">
                  Tap to auto-fill, then fine-tune
                </span>
              </div>
              <div
                className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory"
                style={{ scrollbarWidth: "thin" }}
              >
                {visibleBudgetPresets.map((preset) => {
                  const isActive = selectedPresetSlug === preset.slug;
                  return (
                    <button
                      key={preset.slug}
                      type="button"
                      onClick={() => applyPreset(preset.slug)}
                      className={`flex w-36 shrink-0 snap-start flex-col gap-1 rounded-2xl border px-3.5 py-3 text-left transition ${
                        isActive
                          ? "border-primary bg-primary-soft shadow-[0_0_0_1px_var(--color-primary)]"
                          : "border-border bg-surface hover:border-primary/40 hover:bg-primary-soft/30"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-strong">
                          {preset.name}
                        </span>
                        {isActive ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                            ✓
                          </span>
                        ) : null}
                      </span>
                      {preset.short_label ? (
                        <span className="text-sm font-bold leading-tight text-primary">
                          {preset.short_label}
                        </span>
                      ) : null}
                      {preset.guest_range_label ? (
                        <span className="text-[10px] font-medium text-subtle">
                          {preset.guest_range_label}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Total budget hero */}
          <div className="rounded-2xl bg-primary-soft px-5 py-4 ring-1 ring-primary/15">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
              Your total budget
            </div>
            <div className="mt-0.5 text-3xl font-bold tabular-nums text-primary">
              {formatBudget(totalAllocated)}
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-muted">
              Allocated across {budgetAllocations.length} categor
              {budgetAllocations.length === 1 ? "y" : "ies"}
            </div>
          </div>

          {/* Per-category sliders */}
          <div>
            <div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
              Adjust by category
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1.5">
              {budgetAllocations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-surface px-3 py-6 text-center text-sm font-medium text-muted">
                  Loading journey steps…
                </div>
              ) : null}
              {budgetAllocations.map((item, index) => {
                const min = Math.max(Number(item.min_budget) || 0, 0);
                const max = Math.max(
                  Number(item.max_budget) || 0,
                  Number(item.amount) || 0,
                  500000,
                  min,
                );
                const value = Math.max(min, Math.min(max, Number(item.amount) || 0));
                return (
                  <div
                    key={item.step_id || item.slug || index}
                    className="rounded-2xl border border-border bg-surface px-4 py-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-text-strong">{item.title}</span>
                      <span className="text-sm font-bold tabular-nums text-primary">
                        {formatBudget(value)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step="1000"
                      value={value}
                      onChange={(e) => updateBudgetAmount(index, e.target.value)}
                      className="mt-3 w-full cursor-pointer accent-primary"
                      aria-label={`${item.title} budget`}
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-medium text-subtle">
                      <span>{formatBudget(min)}</span>
                      {item.blurb ? (
                        <span className="truncate italic text-subtle/80">{item.blurb}</span>
                      ) : null}
                      <span>{formatBudget(max)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={finishBudget}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Saving..." : "Finish"}
            </button>
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.guests)}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted"
            >
              Back
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  // fallback
  return null;
}

