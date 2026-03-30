"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthScene from "@/components/AuthScene";
import { getAuthToken, getAuthUser, saveAuthCookies } from "@/lib/authCookies";
import {
  loginUser,
  requestResetOtp,
  resetPassword,
  verifyUserOtp,
} from "@/lib/api";
import { isValidIndianPhone, normalizeIndianPhone, validatePasswordStrength } from "@/lib/authValidation";
import { makeIdempotencyKey } from "@/lib/idempotencyKey";
import { toast } from "sonner";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-40">
      <path d="M5.121 17.804A13.937 13.937 0 013.5 12c0-4.418 3.582-8 8-8s8 3.582 8 8a13.937 13.937 0 01-1.621 5.804M12 20h.01m-4.01-1h8m-8-2h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 opacity-40">
      <path d="M12 11v2m0 4h.01m-6.01-6h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm3-3V7a3 3 0 116 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export default function LoginFlow({ initialSteps = [] }) {
  const router = useRouter();
  const [steps] = useState(initialSteps);
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [form, setForm] = useState({
    phone: "",
    password: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
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
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        throw new Error("Enter a valid 10-digit Indian phone number.");
      }
      if (!form.password.trim()) {
        throw new Error("Password is required.");
      }
      const payload = { phone, purpose: "login" };
      const idempotencyKey = makeIdempotencyKey("auth/login", payload);
      const data = await loginUser(phone, form.password, { idempotencyKey });
      saveAuthCookies(data);
      toast.success("Login successful.");
      
      const searchParams = new URLSearchParams(window.location.search);
      const returnTo = searchParams.get("returnTo");
      if (returnTo) {
        router.push(returnTo);
        return;
      }

      if (data.user?.onboarding?.engagement_status === "just_exploring") {
        router.push("/shopping");
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

  async function handleRequestResetOtp(e) {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        throw new Error("Enter a valid 10-digit Indian phone number.");
      }
      const payload = { phone, purpose: "reset" };
      const idempotencyKey = makeIdempotencyKey("auth/request-reset-otp", payload);
      const data = await requestResetOtp(phone, { idempotencyKey });
      setDevOtp(data.devOtp || "");
      toast.success("OTP sent for password reset.");
      setMode("resetOtp");
    } catch (e2) {
      toast.error(e2.message || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyResetOtp(e) {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const phone = normalizeIndianPhone(form.phone);
      if (!isValidIndianPhone(phone)) {
        throw new Error("Enter a valid 10-digit Indian phone number.");
      }
      const payload = { phone, otp: form.otp, purpose: "reset" };
      const idempotencyKey = makeIdempotencyKey("auth/verify-reset-otp", payload);
      const data = await verifyUserOtp(phone, form.otp, "reset", { idempotencyKey });
      setVerificationToken(data.verificationToken);
      toast.success("OTP verified.");
      setMode("resetPassword");
    } catch (e2) {
      toast.error(e2.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const passwordError = validatePasswordStrength(form.newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }
      if (form.newPassword !== form.confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const payload = {
        verification_token: verificationToken,
        password: form.newPassword,
      };
      const keyPayload = { verification_token: verificationToken, purpose: "reset-password" };
      const idempotencyKey = makeIdempotencyKey("auth/reset-password", keyPayload);
      await resetPassword(payload, { idempotencyKey });
      toast.success("Password reset successful. Please login.");
      setMode("login");
      setForm((f) => ({
        ...f,
        password: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (e2) {
      toast.error(e2.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScene
      title={
        mode === "login"
          ? "Welcome Back"
          : mode === "resetRequest"
            ? "Forgot Password?"
            : mode === "resetOtp"
              ? "Verify OTP"
              : "Set Password"
      }
      subtitle={
        mode === "login"
          ? "Login to your account to continue your journey."
          : mode === "resetRequest"
            ? "We'll send an OTP to your registered number."
            : mode === "resetOtp"
              ? "Enter the 6-digit code sent to your phone."
              : "Create a new secure password for your account."
      }
      variant={mode === "login" ? 0 : 2}
    >
      <div className="space-y-6">
        {mode === "resetOtp" && devOtp ? (
          <p className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">
            Dev OTP: <span className="font-bold text-slate-900">{devOtp}</span>
          </p>
        ) : null}

        {mode === "login" ? (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="relative flex items-center">
              <span className="absolute left-6 text-md font-semibold text-slate-400">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: normalizeIndianPhone(e.target.value) }))}
                className={`${INPUT_CLASS} pl-14 placeholder:text-slate-300`}
                required
              />
            </div>
            
            <div className="relative flex items-center">
              <span className="absolute left-6"><LockIcon strokeWidth={4} /></span>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={`${INPUT_CLASS} pl-12 placeholder:text-slate-300`}
                required
              />
            </div>

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
                setDevOtp("");
                setMode("resetRequest");
              }}
              className="mx-auto block cursor-pointer text-sm font-bold text-[#ff4f86] hover:underline"
            >
              Forgot password?
            </button>
            
            <SocialAuth />

            <div className="pt-2 text-center text-sm font-medium text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#ff4f86] hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        ) : null}

        {mode === "resetRequest" ? (
          <form className="space-y-5" onSubmit={handleRequestResetOtp}>
             <div className="relative flex items-center">
              <span className="absolute left-6 text-md font-semibold text-slate-400">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: normalizeIndianPhone(e.target.value) }))}
                className={`${INPUT_CLASS} pl-14`}
                required
              />
            </div>
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
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </form>
        ) : null}

        {mode === "resetOtp" ? (
          <form className="space-y-5" onSubmit={handleVerifyResetOtp}>
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
                onClick={() => setMode("resetRequest")}
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
        ) : null}

        {mode === "resetPassword" ? (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="New password"
              value={form.newPassword}
              onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
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
                onClick={() => setMode("resetOtp")}
                className={`flex-1 cursor-pointer ${SECONDARY_BTN_CLASS}`}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 cursor-pointer ${PRIMARY_BTN_CLASS}`}
              >
                {loading ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </AuthScene>
  );
}
