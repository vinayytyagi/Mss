"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthScene from "@/components/AuthScene";
import { getAuthToken, getAuthUser, saveAuthCookies } from "@/lib/authCookies";
import { requestUserOtp, signupUser, verifyUserOtp, progressiveSave } from "@/lib/api";
import { formatLakhs, slugify } from "@/lib/utils";
import { isValidIndianPhone, normalizeIndianPhone, validatePasswordStrength } from "@/lib/authValidation";
import { makeIdempotencyKey } from "@/lib/idempotencyKey";
import { toast } from "sonner";

const ONBOARDING_STEPS = ["Engagement", "Wedding Date", "Venue", "Guests", "Budget"];
const MAX_BUDGET_PER_STEP = 10000000;

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-40">
      <path d="M12 11a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 1114 0H5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-40">
      <path d="M5.121 17.804A13.937 13.937 0 013.5 12c0-4.418 3.582-8 8-8s8 3.582 8 8a13.937 13.937 0 01-1.621 5.804M12 20h.01m-4.01-1h8m-8-2h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SocialAuth() {
  return (
    <div className="mt-8 space-y-6">
      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  )
}

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#ff4f86]";
const PRIMARY_BTN_CLASS =
  "h-11 rounded-xl bg-[#ff4f86] px-4 text-sm font-semibold text-white transition hover:bg-[#ff3d79] disabled:opacity-60";
const SECONDARY_BTN_CLASS =
  "h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

function formatBudgetCompact(amount) {
  const num = Number(amount || 0);
  if (!num) return "0";
  if (num >= 10000000) return `${(num / 10000000).toFixed(1).replace(/\.0$/, "")} C`;
  if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, "")} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")} T`;
  return `${num}`;
}

export default function SignupFlow({ initialSteps = [] }) {
  const router = useRouter();
  const [steps] = useState(initialSteps);
  const [phase, setPhase] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    otp: "",
    password: "",
    confirmPassword: "",
    engagement_status: "yes",
    wedding_date_type: "exact",
    wedding_date: "",
    wedding_month: "",
    venue_location: "",
    guests_count: "",
  });
  const [budgetAllocations, setBudgetAllocations] = useState(
    initialSteps.map((step) => ({
      step_id: step.step_id,
      slug: step.slug,
      title: step.title,
      amount: step.default_budget || 0,
      max_budget: Math.max(Number(step.max_budget) || 0, Number(step.default_budget) || 0, 500000),
    }))
  );
  const todayIso = new Date().toISOString().split("T")[0];
  const currentMonthIso = todayIso.slice(0, 7);

  useEffect(() => {
    try {
      const token = getAuthToken();
      const user = getAuthUser();
      if (!token || !user) return;
      if (user?.onboarding?.engagement_status === "just_exploring") {
        router.replace("/shopping");
        return;
      }
      const firstStep = steps[0];
      if (firstStep) router.replace(`/journey/${firstStep.slug}`);
    } catch {
      // ignore malformed state
    }
  }, [router, steps]);

  const activeOnboardingIndex = useMemo(() => {
    const map = {
      engagement: 0,
      weddingDate: 1,
      venue: 2,
      guests: 3,
      budget: 4,
    };
    return map[phase] ?? 0;
  }, [phase]);

  const totalAllocated = useMemo(
    () => budgetAllocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [budgetAllocations]
  );

  function updateBudgetAmount(index, value) {
    const cleaned = String(value || "").replace(/[^\d]/g, "");
    setBudgetAllocations((list) =>
      list.map((entry, i) => {
        if (i !== index) return entry;
        const maxBudget = Math.max(Number(entry.max_budget) || 0, Number(entry.amount) || 0, 500000);
        const amount = Math.min(maxBudget || MAX_BUDGET_PER_STEP, Number(cleaned || 0));
        return { ...entry, amount };
      })
    );
  }

  async function handleRequestOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.name.trim()) throw new Error("Name is required.");
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        throw new Error("Enter a valid 10-digit Indian phone number.");
      }
      const requestPayload = { phone, purpose: "signup" };
      const idempotencyKey = makeIdempotencyKey("auth/request-otp", requestPayload);
      const data = await requestUserOtp(phone, "signup", { idempotencyKey });
      setDevOtp(data.devOtp || "");
      
      // Save name and phone immediately after OTP request
      try {
        const initialSavePayload = { name: form.name, phone };
        const initialSaveKey = makeIdempotencyKey("auth/progressive-save:init", initialSavePayload);
        await progressiveSave(initialSavePayload, { idempotencyKey: initialSaveKey });
      } catch (saveErr) {
        console.warn("Failed to save initial signup data:", saveErr.message);
      }
      
      toast.success("OTP sent successfully.");
      setPhase("otp");
    } catch (e2) {
      toast.error(e2.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        throw new Error("Enter a valid 10-digit Indian phone number.");
      }
      const verifyPayload = { phone, otp: form.otp, purpose: "signup" };
      const idempotencyKey = makeIdempotencyKey("auth/verify-otp", verifyPayload);
      const data = await verifyUserOtp(phone, form.otp, "signup", { idempotencyKey });
      setVerificationToken(data.verificationToken);
      toast.success("Phone number verified.");
      setPhase("password");
      // Phone already saved in handleRequestOtp, no need to save again here
    } catch (e2) {
      toast.error(e2.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordNext(e) {
    e.preventDefault();
    const passwordError = validatePasswordStrength(form.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPhase("engagement");
  }

  async function saveEngagementProgress(nextEngagementStatus = form.engagement_status) {
    setLoading(true);
    try {
      const payload = {
        verification_token: verificationToken,
        engagement_status: nextEngagementStatus,
      };
      const idempotencyKey = makeIdempotencyKey("auth/progressive-save:engagement", payload);
      await progressiveSave(payload, { idempotencyKey });
    } catch (e2) {
      console.warn("Failed to save engagement status:", e2.message);
      // Don't block flow on save error
    } finally {
      setLoading(false);
    }
  }

  async function saveWeddingDateProgress() {
    setLoading(true);
    try {
      const payload = {
        verification_token: verificationToken,
        wedding_date_type: form.wedding_date_type,
      };
      if (form.wedding_date_type === "exact") payload.wedding_date = form.wedding_date || null;
      if (form.wedding_date_type === "month") payload.wedding_month = form.wedding_month || null;

      const idempotencyKey = makeIdempotencyKey("auth/progressive-save:wedding-date", payload);
      await progressiveSave(payload, { idempotencyKey });
    } catch (e2) {
      console.warn("Failed to save wedding date:", e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveVenueProgress() {
    setLoading(true);
    try {
      const payload = {
        verification_token: verificationToken,
        venue_location: form.venue_location || null,
      };
      const idempotencyKey = makeIdempotencyKey("auth/progressive-save:venue", payload);
      await progressiveSave(payload, { idempotencyKey });
    } catch (e2) {
      console.warn("Failed to save venue location:", e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveGuestsProgress() {
    setLoading(true);
    try {
      const payload = {
        verification_token: verificationToken,
        guests_count: Number(form.guests_count) || 0,
      };
      const idempotencyKey = makeIdempotencyKey("auth/progressive-save:guests", payload);
      await progressiveSave(payload, { idempotencyKey });
    } catch (e2) {
      console.warn("Failed to save guests count:", e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveBudgetProgress() {
    setLoading(true);
    try {
      const payload = {
        verification_token: verificationToken,
        budget_total: totalAllocated,
        budget_allocations: budgetAllocations.map((item) => ({
          step_id: item.step_id,
          slug: item.slug || slugify(item.title),
          title: item.title,
          amount: Number(item.amount) || 0,
          max_budget: Number(item.max_budget) || MAX_BUDGET_PER_STEP,
        })),
      };
      const idempotencyKey = makeIdempotencyKey("auth/progressive-save:budget", payload);
      await progressiveSave(payload, { idempotencyKey });
    } catch (e2) {
      console.warn("Failed to save budget:", e2.message);
    } finally {
      setLoading(false);
    }
  }

  async function finishSignup(nextEngagementStatus = form.engagement_status) {
    setLoading(true);
    try {
      const payload = {
        verification_token: verificationToken,
        name: form.name,
        password: form.password,
        engagement_status: nextEngagementStatus,
        wedding_date_type: form.wedding_date_type,
      };

      if (form.wedding_date_type === "exact") payload.wedding_date = form.wedding_date || null;
      if (form.wedding_date_type === "month") payload.wedding_month = form.wedding_month || null;

      Object.assign(payload, {
        budget_total: totalAllocated,
        budget_allocations: budgetAllocations.map((item) => ({
          step_id: item.step_id,
          slug: item.slug || slugify(item.title),
          title: item.title,
          amount: Number(item.amount) || 0,
          max_budget: Number(item.max_budget) || MAX_BUDGET_PER_STEP,
        })),
        venue_location: form.venue_location || null,
        guests_count: Number(form.guests_count) || 0,
      });

      const payloadForKey = { ...payload };
      delete payloadForKey.password;
      const idempotencyKey = makeIdempotencyKey("auth/signup", payloadForKey);
      const data = await signupUser(payload, { idempotencyKey });
      saveAuthCookies(data);

      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        router.push(returnTo);
        return;
      }

      if (nextEngagementStatus === "just_exploring") {
        router.push("/shopping");
        return;
      }

      const firstStep = steps[0];
      router.push(firstStep ? `/journey/${firstStep.slug}` : "/");
    } catch (e2) {
      toast.error(e2.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  const questionTitleMap = {
    engagement: "Are you engaged?",
    weddingDate: "When is your big day?",
    venue: "Where is your venue location?",
    guests: "How many guests?",
    budget: "What's your estimated budget?",
  };

  const questionSubtitleMap = {
    engagement: "Let's know where you are in your journey",
    weddingDate: "Choose the timing that fits your current planning stage",
    venue: "Venue location will help personalize recommendations",
    guests: "Guest count helps refine your planning needs",
    budget: "Set budget journey-step wise and total will be auto-calculated",
  };

  if (phase === "phone") {
    return (
      <AuthScene
        title="Plan Your Dream Wedding"
        subtitle="Add a few details to create your personalized wedding journey."
        variant={0}
      >
        <form className="space-y-5" onSubmit={handleRequestOtp}>
          {null}
          <div className="relative flex items-center">
            <span className="absolute left-6"><UserIcon /></span>
            <input
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`${INPUT_CLASS} pl-12 placeholder:text-slate-300`}
              required
            />
          </div>
          
          <div className="relative flex items-center">
            <span className="absolute left-6 text-md font-semibold text-slate-400">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: normalizeIndianPhone(e.target.value) }))}
              className={`${INPUT_CLASS} pl-14 placeholder:text-slate-300`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full cursor-pointer ${PRIMARY_BTN_CLASS}`}
          >
            {loading ? "Sending OTP..." : "Continue"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already a user?{" "}
            <Link href="/login" className="font-semibold text-[#ff4f86] underline underline-offset-4">
              Login
            </Link>
          </p>
          
          <SocialAuth />
        </form>
      </AuthScene>
    );
  }

  if (phase === "otp") {
    return (
      <AuthScene
        title="Verify your number"
        subtitle={`Enter the OTP sent to +91 ${normalizeIndianPhone(form.phone)}`}
        variant={1}
      >
        <form className="space-y-5" onSubmit={handleVerifyOtp}>
          {devOtp ? (
            <p className="mb-2 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">
              Dev OTP: <span className="font-bold text-slate-900">{devOtp}</span>
            </p>
          ) : null}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter OTP"
            value={form.otp}
            onChange={(e) => setForm((f) => ({ ...f, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
            className={`${INPUT_CLASS} tracking-[0.2em]`}
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase("phone")}
              className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>
      </AuthScene>
    );
  }

  if (phase === "password") {
    return (
      <AuthScene
        title="Set your password"
        subtitle="Create a password for future login with phone number and password."
        variant={2}
      >
        <form className="space-y-5" onSubmit={handlePasswordNext}>
          {null}
          <input
            type="password"
            placeholder="Create password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className={INPUT_CLASS}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className={INPUT_CLASS}
            required
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase("otp")}
              className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
            >
              Back
            </button>
            <button
              type="submit"
              className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
            >
              Continue
            </button>
          </div>
        </form>
      </AuthScene>
    );
  }

  return (
    <AuthScene
      title={questionTitleMap[phase]}
      subtitle={questionSubtitleMap[phase]}
      stepLabels={ONBOARDING_STEPS}
      activeStep={activeOnboardingIndex}
      variant={activeOnboardingIndex + 1}
    >
      <div className="space-y-5">
        {null}

        {phase === "engagement" ? (
          <>
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
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                if (form.engagement_status === "just_exploring") {
                  await saveEngagementProgress("just_exploring");
                  finishSignup("just_exploring");
                } else {
                  await saveEngagementProgress();
                  setPhase("weddingDate");
                }
              }}
              className={`w-full cursor-pointer ${PRIMARY_BTN_CLASS}`}
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </>
        ) : null}

        {phase === "weddingDate" ? (
          <>
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
                className={INPUT_CLASS}
              />
            ) : null}

            {form.wedding_date_type === "month" ? (
              <input
                type="month"
                min={currentMonthIso}
                value={form.wedding_month}
                onChange={(e) => setForm((f) => ({ ...f, wedding_month: e.target.value }))}
                className={INPUT_CLASS}
              />
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("engagement")}
                className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (form.wedding_date_type === "exact" && !form.wedding_date) {
                    toast.error("Please select your wedding date.");
                    return;
                  }
                  if (form.wedding_date_type === "month" && !form.wedding_month) {
                    toast.error("Please select your wedding month.");
                    return;
                  }
                  await saveWeddingDateProgress();
                  setPhase("venue");
                }}
                className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {phase === "venue" ? (
          <>
            <input
              type="text"
              placeholder="e.g. Jaipur, Udaipur, Delhi NCR"
              value={form.venue_location}
              onChange={(e) => setForm((f) => ({ ...f, venue_location: e.target.value }))}
              className={INPUT_CLASS}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("weddingDate")}
                className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!String(form.venue_location || "").trim()) {
                    toast.error("Please enter your venue location.");
                    return;
                  }
                  await saveVenueProgress();
                  setPhase("guests");
                }}
                className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {phase === "guests" ? (
          <>
            <input
              type="number"
              min="0"
              placeholder="e.g. 300"
              value={form.guests_count}
              onChange={(e) => setForm((f) => ({ ...f, guests_count: e.target.value }))}
              className={INPUT_CLASS}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("venue")}
                className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  const guests = Number(form.guests_count);
                  if (!guests || guests <= 0) {
                    toast.error("Please enter expected guest count.");
                    return;
                  }
                  await saveGuestsProgress();
                  setPhase("budget");
                }}
                className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {phase === "budget" ? (
          <>
            <div className="rounded-xl bg-white p-4">
              <div className="text-center text-xl font-semibold text-[#ff4f86]">{formatBudgetCompact(totalAllocated)}</div>
              <div className="mt-1 text-center text-[11px] font-medium text-slate-400">
                Auto total ({formatLakhs(totalAllocated)})
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-white p-3">
              <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {budgetAllocations.map((item, index) => (
                  <div key={item.step_id} className="rounded-lg border border-slate-100 bg-[#fffafb] px-3 py-2">
                    <div className="grid grid-cols-[88px_1fr_84px] items-center gap-2">
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
                      {formatBudgetCompact(item.amount)} / Max {formatBudgetCompact(item.max_budget || MAX_BUDGET_PER_STEP)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("guests")}
                className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  await saveBudgetProgress();
                  finishSignup();
                }}
                className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
              >
                {loading ? "Starting..." : "Start Planning"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </AuthScene>
  );
}
