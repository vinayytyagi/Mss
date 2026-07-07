"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthScene from "@/components/AuthScene";
import { resetPassword } from "@/lib/api";
import { validatePasswordStrength } from "@/lib/authValidation";
import { toast } from "sonner";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none transition focus:border-primary";
const PRIMARY_BTN_CLASS =
  "h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      toast.success("Password reset successful. Please login.");
      router.push("/login");
    } catch (err) {
      toast.error(err?.message || "Reset failed. Request a new link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScene
      title="Set a new password"
      subtitle="Choose a strong password for your account."
      variant={2}
    >
      <div className="space-y-6">
        {!token ? (
          <div className="space-y-5">
            <p className="rounded-2xl bg-surface-muted px-4 py-3 text-center text-sm font-medium text-text">
              This reset link is missing its token. Open the link from your email exactly as it was sent.
            </p>
            <Link
              href="/login"
              className={`block text-center ${PRIMARY_BTN_CLASS} pt-3`}
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={INPUT_CLASS}
              autoComplete="new-password"
              required
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={INPUT_CLASS}
              autoComplete="new-password"
              required
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              Show password
            </label>
            <p className="text-xs leading-relaxed text-muted">
              Password must be 8+ characters with upper, lower, number, and a special character.
            </p>
            <button type="submit" disabled={loading} className={`w-full cursor-pointer ${PRIMARY_BTN_CLASS}`}>
              {loading ? "Saving..." : "Reset password"}
            </button>
            <Link
              href="/login"
              className="mx-auto block cursor-pointer text-center text-sm font-bold text-primary hover:underline"
            >
              Back to login
            </Link>
          </form>
        )}
      </div>
    </AuthScene>
  );
}
