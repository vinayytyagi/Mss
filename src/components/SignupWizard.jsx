"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthScene from "@/components/AuthScene";
import CityStateDropdown from "@/components/CityStateDropdown";
import { getAuthToken, getAuthUser, saveAuthCookies } from "@/lib/authCookies";
import { fetchJourneySteps, registerWithPhonePassword } from "@/lib/api";
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
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
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
      max_budget: Math.max(Number(a.max_budget) || 0, Number(a.amount) || 0, 500000),
    }));
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
      const maxBudget = Math.max(Number(entry.max_budget) || 0, Number(entry.amount) || 0, 500000);
      const amount = Math.min(maxBudget || MAX_BUDGET_PER_STEP, Number(cleaned || 0));
      next[index] = { ...entry, amount };
      return next;
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
            max_budget: Math.max(Number(s.max_budget) || 0, Number(s.default_budget) || 0, 500000),
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
        toast.error("Session expired. Please start again.");
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
      toast.error("Session expired. Please login again.");
      router.replace("/login");
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
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
            required
          />
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="Email (optional)"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
          />
          <div className="relative flex items-center">
            <span className="absolute left-6 text-md font-semibold text-slate-400">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: normalizeIndianPhone(e.target.value) }))}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-14 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
              required
            />
          </div>
          <button type="submit" className="h-11 w-full rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79]">
            Continue
          </button>
          <p className="text-center text-sm text-slate-500">
            Already a user?{" "}
            <Link href="/login" className="font-semibold text-[#ff4f86] underline underline-offset-4">
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
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
            required
            autoComplete="new-password"
          />
          <p className="text-xs leading-relaxed text-slate-500">
            Password must be 8+ characters with upper, lower, number, and a special character.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.signup)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
                  ? "border-[#ff8ab0] bg-white shadow-[0_10px_24px_rgba(255,79,134,0.08)]"
                  : "border-slate-200 bg-white/70"
              }`}
            >
              <div className="text-base font-semibold text-slate-700">{title}</div>
              <div className="mt-1 text-sm text-slate-500">{text}</div>
            </button>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => router.back()}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
                  ? "border-[#ff8ab0] bg-white"
                  : "border-slate-200 bg-white/70 text-slate-600"
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
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
            />
          ) : null}

          {form.wedding_date_type === "month" ? (
            <input
              type="month"
              min={currentMonthIso}
              value={form.wedding_month}
              onChange={(e) => setForm((f) => ({ ...f, wedding_month: e.target.value }))}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
            />
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.engaged)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
                  ? "border-[#ff8ab0] bg-white shadow-[0_10px_24px_rgba(255,79,134,0.08)]"
                  : "border-slate-200 bg-white/70"
              }`}
            >
              <div className="text-base font-semibold text-slate-700">{title}</div>
              <div className="mt-1 text-sm text-slate-500">{text}</div>
            </button>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.venue)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH["groom-bride"])}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
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
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.days)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  if (step === "budget") {
    return (
      <AuthScene
        title="Budget"
        subtitle="Set your estimated budget (step-wise)."
        variant={9}
        stepLabels={showStepper ? stepLabels : []}
        activeStep={activeStep}
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-white p-4 text-center">
            <div className="text-xl font-semibold text-[#ff4f86]">₹{totalAllocated.toLocaleString("en-IN")}</div>
            <div className="mt-1 text-[11px] font-medium text-slate-400">Auto total</div>
          </div>

          <div className="space-y-2 rounded-xl bg-white p-3">
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {budgetAllocations.map((item, index) => (
                <div key={item.step_id || item.slug || index} className="rounded-lg border border-slate-100 bg-[#fffafb] px-3 py-2">
                  <div className="grid grid-cols-[92px_1fr_92px] items-center gap-2">
                    <div className="truncate text-xs font-semibold text-slate-700">{item.title}</div>
                    <input
                      type="range"
                      min="0"
                      max={item.max_budget || MAX_BUDGET_PER_STEP}
                      step="50000"
                      value={item.amount || 0}
                      onChange={(e) => updateBudgetAmount(index, e.target.value)}
                      className="w-full cursor-pointer accent-[#ff4f86]"
                    />
                    <input
                      type="number"
                      min="0"
                      max={item.max_budget || MAX_BUDGET_PER_STEP}
                      step="50000"
                      value={item.amount || 0}
                      onChange={(e) => updateBudgetAmount(index, e.target.value)}
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none"
                    />
                  </div>
                  <div className="mt-1 text-right text-[10px] font-medium text-slate-400">
                    ₹{Number(item.amount || 0).toLocaleString("en-IN")} / Max ₹{Number(item.max_budget || MAX_BUDGET_PER_STEP).toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
              {budgetAllocations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-sm font-medium text-slate-500">
                  Loading journey steps…
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => goto(STEP_TO_PATH.guests)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const ok = await saveAfterLogin("done", {
                  budget_total: totalAllocated,
                  budget_allocations: budgetAllocations.map((item) => ({
                    step_id: item.step_id,
                    slug: item.slug,
                    title: item.title,
                    amount: Number(item.amount) || 0,
                    max_budget: Number(item.max_budget) || MAX_BUDGET_PER_STEP,
                  })),
                });
                if (!ok) return;
                clearState();
                router.push("/");
              }}
              className="h-11 flex-1 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60"
            >
              {loading ? "Saving..." : "Finish"}
            </button>
          </div>
        </div>
      </AuthScene>
    );
  }

  // fallback
  return null;
}

