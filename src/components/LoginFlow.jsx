"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock } from "lucide-react";
import AuthScene from "@/components/AuthScene";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getAuthToken, getAuthUser, saveAuthCookies } from "@/lib/authCookies";
import {
  loginUser,
  requestPasswordResetLink,
  googleAuth,
  completeGooglePhone,
} from "@/lib/api";
import { isValidEmail, isValidIndianPhone, normalizeIndianPhone } from "@/lib/authValidation";
import { sendAttribution } from "@/lib/attribution";
import { toast } from "sonner";

function computeResumePhaseFromOnboarding(onboarding = {}) {
  const o = onboarding || {};
  const progressStep = String(o?.onboarding_progress?.current_step || "").trim();
  if (progressStep) return progressStep;
  const engagement = String(o.engagement_status || "").trim();
  if (!engagement) return "engagement";

  const weddingType = String(o.wedding_date_type || "").trim();
  if (!weddingType) return "weddingDate";
  if (weddingType === "exact" && !String(o.wedding_date || "").trim()) return "weddingDate";
  if (weddingType === "month" && !String(o.wedding_month || "").trim()) return "weddingDate";

  if (!String(o.venue_location || "").trim()) return "venue";
  if (!String(o.groom_or_bride || "").trim()) return "groomBride";
  if (!(Number(o.function_days) > 0)) return "functionDays";
  if (!(Number(o.guests_count) > 0)) return "guests";

  // `budget_allocations` is intentionally not stored in the auth cookie (size),
  // so treat a positive budget_total as "budget done" too.
  const allocs = Array.isArray(o.budget_allocations) ? o.budget_allocations : [];
  if (allocs.length === 0 && !(Number(o.budget_total) > 0)) return "budget";

  return "done";
}

function resumePathFromUser(user) {
  const step = String(user?.onboarding_progress?.current_step || "").trim();
  const map = {
    engagement: "/signup/engaged",
    weddingDate: "/signup/date",
    venue: "/signup/venue",
    groomBride: "/signup/groom-bride",
    functionDays: "/signup/days",
    guests: "/signup/guests",
    budget: "/signup/budget",
  };
  if (step && map[step]) return map[step];
  // fallback to onboarding fields
  const derived = computeResumePhaseFromOnboarding(user?.onboarding || {});
  return (
    {
      engagement: "/signup/engaged",
      weddingDate: "/signup/date",
      venue: "/signup/venue",
      groomBride: "/signup/groom-bride",
      functionDays: "/signup/days",
      guests: "/signup/guests",
      budget: "/signup/budget",
    }[derived] || null
  );
}


function SocialAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // { pending_token, name, email }
  const [phone, setPhone] = useState("");

  const Divider = (
    <div className="relative flex items-center">
      <div className="h-px flex-1 bg-border-strong" />
      <span className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-border-strong">Or</span>
      <div className="h-px flex-1 bg-border-strong" />
    </div>
  );

  // Google not configured (no client id) → keep the original divider-only look.
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return <div className="mt-8 space-y-6">{Divider}</div>;
  }

  function finish(data) {
    saveAuthCookies(data);
    sendAttribution(getAuthToken()).catch(() => {});
    const r = searchParams.get("redirect") || searchParams.get("returnTo");
    // Full-page navigation (not router.push) so the server re-reads the
    // freshly-set mss_user cookie and the header renders logged-in. A
    // client-side push left the persistent navbar showing Login/Sign up
    // after Google sign-in (stale SSR state in the force-dynamic layout).
    window.location.assign(r || "/");
  }

  async function onCredential(credential) {
    setBusy(true);
    try {
      const res = await googleAuth(credential);
      if (res?.token) {
        toast.success("Signed in with Google");
        finish(res);
        return;
      }
      if (res?.needs_phone && res?.pending_token) {
        setPending({ pending_token: res.pending_token, name: res.name, email: res.email });
        return;
      }
      throw new Error("Google sign-in failed");
    } catch (e) {
      toast.error(e.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitPhone(e) {
    e.preventDefault();
    const p = normalizeIndianPhone(phone);
    if (!isValidIndianPhone(p)) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await completeGooglePhone({ pending_token: pending.pending_token, phone: p, name: pending.name });
      toast.success("Welcome to MyShaadiStore!");
      finish(res);
    } catch (e) {
      toast.error(e.message || "Could not complete signup.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {Divider}
      {pending ? (
        <form onSubmit={submitPhone} className="space-y-3">
          <p className="text-center text-sm text-muted">
            Almost there{pending.name ? `, ${pending.name.split(" ")[0]}` : ""} — add your mobile number to finish.
          </p>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className={INPUT_CLASS}
          />
          <button type="submit" disabled={busy} className={`${PRIMARY_BTN_CLASS} w-full`}>
            {busy ? "Please wait…" : "Continue"}
          </button>
        </form>
      ) : (
        <div className="flex justify-center">
          <GoogleSignInButton onCredential={onCredential} />
        </div>
      )}
    </div>
  );
}

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary";
const PRIMARY_BTN_CLASS =
  "h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60";
const SECONDARY_BTN_CLASS =
  "h-11 rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text transition hover:bg-surface-muted";

export default function LoginFlow({ initialSteps = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [steps] = useState(initialSteps);
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Remember the redirect target across re-renders so the "Sign up"
  // link can pass it along (otherwise the customer signs up and lands
  // on /journey/venue instead of the page they were originally trying
  // to reach, e.g. /cart).
  const redirectTo = searchParams.get("redirect") || searchParams.get("returnTo") || "";
  const signupHref = redirectTo
    ? `/signup?redirect=${encodeURIComponent(redirectTo)}`
    : "/signup";
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    resetEmail: "",
  });

  useEffect(() => {
    try {
      const token = getAuthToken();
      const user = getAuthUser();
      if (!token || !user) return;
      if (user?.onboarding?.engagement_status === "just_exploring") {
        router.replace("/shopping");
        return;
      }
      const resumePath = resumePathFromUser(user);
      if (resumePath) {
        router.replace(resumePath);
        return;
      }
      const firstStep = steps[0];
      if (firstStep) router.replace(`/journey/${firstStep.slug}`);
    } catch {
      // ignore malformed state
    }
  }, [router, steps]);

  function resetMessages() {}

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const raw = String(form.identifier || "").trim();
      if (!raw) {
        throw new Error("Enter your phone number or email.");
      }
      // Either a 10-digit Indian phone OR an email is accepted.
      let identifier;
      if (raw.includes("@")) {
        const email = raw.toLowerCase();
        if (!isValidEmail(email)) {
          throw new Error("Enter a valid email address.");
        }
        identifier = email;
      } else {
        const phone = normalizeIndianPhone(raw);
        if (!isValidIndianPhone(phone)) {
          throw new Error("Enter a valid 10-digit phone number or an email.");
        }
        identifier = phone;
      }
      if (!form.password.trim()) {
        throw new Error("Password is required.");
      }
      const data = await loginUser(identifier, form.password);
      if (!data?.token || !data?.user) {
        throw new Error("Login failed. Please try again.");
      }
      saveAuthCookies(data);
      // Re-render server components (e.g. the header) so they pick up the
      // freshly-set auth cookie instead of replaying the logged-out render.
      router.refresh();
      // First-touch lead attribution: flush the captured source to the profile.
      sendAttribution(getAuthToken()).catch(() => {});
      toast.success("Login successful.");
      
      // Accept either `redirect` (new canonical name) or `returnTo`
      // (older name still used by some links). Pages that gate behind
      // auth should send `?redirect=/wherever`.
      const postLoginRedirect = searchParams.get("redirect") || searchParams.get("returnTo");
      if (postLoginRedirect) {
        router.push(postLoginRedirect);
        return;
      }

      if (data.user?.onboarding?.engagement_status === "just_exploring") {
        router.push("/shopping");
        return;
      }
      const resumePath = resumePathFromUser(data.user);
      if (resumePath) {
        router.push(resumePath);
        return;
      }
      const firstStep = steps[0];
      router.push(firstStep ? `/journey/${firstStep.slug}` : "/");
    } catch (e2) {
      toast.error(e2.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const email = String(form.resetEmail || "").trim().toLowerCase();
      if (!isValidEmail(email)) {
        throw new Error("Enter a valid email address.");
      }
      await requestPasswordResetLink(email);
      toast.success("Reset link sent. Check your inbox — it expires in 30 minutes.");
      setMode("resetSent");
    } catch (e2) {
      // The backend tells us when an email isn't registered (UX over enumeration).
      const msg = e2?.code === "EMAIL_NOT_FOUND" || /not registered/i.test(e2?.message || "")
        ? "This email is not registered."
        : e2?.message || "Failed to send reset link.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScene
      title={
        mode === "login"
          ? "Welcome Back"
          : mode === "resetSent"
            ? "Check your email"
            : "Forgot Password?"
      }
      subtitle={
        mode === "login"
          ? "Login to your account to continue your journey."
          : mode === "resetSent"
            ? "We've emailed you a secure link to reset your password."
            : "Enter your registered email — we'll send you a reset link."
      }
      variant={mode === "login" ? 0 : 2}
    >
      <div className="space-y-6">
        {mode === "login" ? (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-4 text-subtle"><User className="h-5 w-5" strokeWidth={2} /></span>
              <input
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="Phone number or email"
                value={form.identifier}
                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                className={`${INPUT_CLASS} pl-12 placeholder:text-border-strong`}
                required
              />
            </div>

            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-4 text-subtle"><Lock className="h-5 w-5" strokeWidth={2} /></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`${INPUT_CLASS} pl-12 placeholder:text-border-strong`}
                required
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              Show password
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full cursor-pointer ${PRIMARY_BTN_CLASS}`}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setForm((f) => ({ ...f, resetEmail: f.identifier.includes("@") ? f.identifier : "" }));
                setMode("resetRequest");
              }}
              className="mx-auto block cursor-pointer text-sm font-bold text-primary hover:underline"
            >
              Forgot password?
            </button>

            <SocialAuth />

            <div className="pt-2 text-center text-sm font-medium text-muted">
              Don&apos;t have an account?{" "}
              <Link href={signupHref} className="text-primary! font-bold!">
                Sign up
              </Link>
            </div>
          </form>
        ) : null}

        {mode === "resetRequest" ? (
          <form className="space-y-5" onSubmit={handleForgotPassword}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your registered email"
              value={form.resetEmail}
              onChange={(e) => setForm((f) => ({ ...f, resetEmail: e.target.value }))}
              className={INPUT_CLASS}
              required
            />
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </div>
          </form>
        ) : null}

        {mode === "resetSent" ? (
          <div className="space-y-5">
            <p className="rounded-2xl bg-surface-muted px-4 py-3 text-center text-sm font-medium text-text">
              A password reset link has been sent to{" "}
              <span className="font-bold text-text-strong">{form.resetEmail}</span>.
              It expires in 30 minutes.
            </p>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`w-full cursor-pointer ${PRIMARY_BTN_CLASS}`}
            >
              Back to login
            </button>
          </div>
        ) : null}
      </div>
    </AuthScene>
  );
}
