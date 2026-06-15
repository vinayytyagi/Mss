"use client";

import { useMemo, useState } from "react";
import { Briefcase, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, isValidIndianPhone, normalizeIndianPhone } from "@/lib/authValidation";
import { submitCareerApplication, uploadCareerResume } from "@/lib/api/careersApi";
import Dropdown from "@/components/ui/Dropdown";

const OPEN_ROLES = [
  "Engineering / Product",
  "Operations",
  "Customer Success",
  "Marketing & Growth",
  "Vendor Partnerships",
  "General application",
];

const ROLE_OPTIONS = OPEN_ROLES.map((r) => ({ value: r, label: r }));

const RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function validate(values, resumeFile) {
  const errors = {};
  if ((values.name || "").trim().length < 2) errors.name = "Please enter your full name.";
  if (!isValidEmail(values.email)) errors.email = "Please enter a valid email address.";
  const phone = normalizeIndianPhone(values.phone);
  if (!isValidIndianPhone(phone)) errors.phone = "Enter a valid 10-digit mobile number.";
  if (!values.role) errors.role = "Please select a role.";
  if (!resumeFile) errors.resume = "Please upload your resume (PDF or Word).";
  const linkedIn = (values.linkedIn || "").trim();
  if (linkedIn && !/^https?:\/\//i.test(linkedIn)) {
    errors.linkedIn = "LinkedIn URL should start with http:// or https://";
  }
  if ((values.message || "").length > 2000) errors.message = "Cover note is too long (max 2000 characters).";
  return errors;
}

export default function CareersApplicationForm() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    experienceYears: "",
    linkedIn: "",
    message: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validate(values, resumeFile), [values, resumeFile]);

  function showError(key) {
    return (submitAttempted || touched[key]) && errors[key];
  }

  function update(key) {
    return (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function markTouched(key) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const fileBase64 = await fileToBase64(resumeFile);
      const upload = await uploadCareerResume({
        fileBase64,
        mimeType: resumeFile.type,
        originalName: resumeFile.name,
      });

      await submitCareerApplication({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: normalizeIndianPhone(values.phone),
        role: values.role,
        experienceYears: values.experienceYears.trim() || null,
        linkedIn: values.linkedIn.trim() || null,
        message: values.message.trim() || null,
        resumeUrl: upload.url,
        resumeFileName: resumeFile.name,
      });

      setSubmitted(true);
      toast.success("Application submitted! Check your email for confirmation.");
    } catch (err) {
      toast.error(err?.message || "Could not submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-primary-soft bg-surface p-8 text-center shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Briefcase className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-text-strong">Thank you for applying!</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We&apos;ve received your application and sent a confirmation to{" "}
          <span className="font-semibold text-text">{values.email}</span>. Our team will review your profile and reach
          out if there&apos;s a match.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-border bg-surface p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Briefcase className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-text-strong sm:text-xl">Apply now</h2>
          <p className="mt-1 text-sm text-muted">
            Share your details and resume. You&apos;ll get a confirmation email, and our careers team will be notified.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">Full name *</span>
          <input
            value={values.name}
            onChange={update("name")}
            onBlur={() => markTouched("name")}
            className={`h-11 rounded-xl border px-3 text-sm text-text-strong outline-none focus:border-primary focus:ring-primary/15 ${
              showError("name") ? "border-danger" : "border-border-strong"
            }`}
            placeholder="Your name"
          />
          {showError("name") ? <span className="text-xs font-medium text-danger">{errors.name}</span> : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted">Email *</span>
          <input
            type="email"
            value={values.email}
            onChange={update("email")}
            onBlur={() => markTouched("email")}
            className={`h-11 rounded-xl border px-3 text-sm text-text-strong outline-none focus:border-primary focus:ring-primary/15 ${
              showError("email") ? "border-danger" : "border-border-strong"
            }`}
            placeholder="you@email.com"
          />
          {showError("email") ? <span className="text-xs font-medium text-danger">{errors.email}</span> : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted">Phone *</span>
          <div
            className={`flex h-11 items-center gap-2 rounded-xl border bg-surface px-3 text-sm outline-none focus-within:border-primary focus-within:ring-primary/15 ${
              showError("phone") ? "border-danger" : "border-border-strong"
            }`}
          >
            <span className="select-none text-muted">+91</span>
            <input
              value={values.phone}
              onChange={(e) => setValues((p) => ({ ...p, phone: normalizeIndianPhone(e.target.value) }))}
              onBlur={() => markTouched("phone")}
              className="h-full w-full bg-transparent text-text-strong outline-none placeholder:text-subtle"
              placeholder="10 digit number"
              inputMode="numeric"
              maxLength={10}
            />
          </div>
          {showError("phone") ? <span className="text-xs font-medium text-danger">{errors.phone}</span> : null}
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">Role you&apos;re applying for *</span>
          <Dropdown
            value={values.role}
            onChange={(next) => {
              setValues((prev) => ({ ...prev, role: next }));
              markTouched("role");
            }}
            options={ROLE_OPTIONS}
            placeholder="Select a role"
            ariaLabel="Role you're applying for"
            className={`rounded-xl ${showError("role") ? "[&>button]:border-danger" : ""}`}
          />
          {showError("role") ? <span className="text-xs font-medium text-danger">{errors.role}</span> : null}
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted">Years of experience</span>
          <input
            value={values.experienceYears}
            onChange={update("experienceYears")}
            className="h-11 rounded-xl border border-border-strong px-3 text-sm text-text-strong outline-none focus:border-primary focus:ring-primary/15"
            placeholder="e.g. 2 years"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-muted">LinkedIn profile</span>
          <input
            value={values.linkedIn}
            onChange={update("linkedIn")}
            onBlur={() => markTouched("linkedIn")}
            className={`h-11 rounded-xl border px-3 text-sm text-text-strong outline-none focus:border-primary focus:ring-primary/15 ${
              showError("linkedIn") ? "border-danger" : "border-border-strong"
            }`}
            placeholder="https://linkedin.com/in/..."
          />
          {showError("linkedIn") ? <span className="text-xs font-medium text-danger">{errors.linkedIn}</span> : null}
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">Resume * (PDF or Word, max 5 MB)</span>
          <div
            className={`flex flex-col gap-3 rounded-xl border border-dashed px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
              showError("resume") ? "border-danger bg-danger/5" : "border-border-strong bg-surface-muted/50"
            }`}
          >
            <div className="flex items-center gap-3 text-sm text-muted">
              <FileUp className="h-5 w-5 shrink-0 text-primary" />
              {resumeFile ? (
                <span className="font-medium text-text">{resumeFile.name}</span>
              ) : (
                <span>Upload your latest resume</span>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-muted">
              Choose file
              <input
                type="file"
                accept={RESUME_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > MAX_RESUME_BYTES) {
                    toast.error("Resume must be 5 MB or smaller.");
                    e.target.value = "";
                    return;
                  }
                  setResumeFile(file);
                  markTouched("resume");
                }}
              />
            </label>
          </div>
          {showError("resume") ? <span className="text-xs font-medium text-danger">{errors.resume}</span> : null}
        </label>

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-xs font-semibold text-muted">Why do you want to join MyShaadiStore?</span>
          <textarea
            value={values.message}
            onChange={update("message")}
            onBlur={() => markTouched("message")}
            rows={4}
            className={`rounded-xl border px-3 py-3 text-sm text-text-strong outline-none focus:border-primary focus:ring-primary/15 ${
              showError("message") ? "border-danger" : "border-border-strong"
            }`}
            placeholder="Tell us about your background, skills, and what excites you about weddings & e-commerce..."
          />
          {showError("message") ? <span className="text-xs font-medium text-danger">{errors.message}</span> : null}
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_28px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit application"
        )}
      </button>
    </form>
  );
}
