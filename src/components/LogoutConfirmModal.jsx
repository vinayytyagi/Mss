"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function LogoutConfirmModal({ open, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-text-strong/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-text-strong">Confirm logout</h3>
        <p className="mt-2 text-sm text-muted">Are you sure you want to logout from your account?</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border-strong px-4 text-sm font-medium text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-danger/100 px-4 text-sm font-semibold text-primary-foreground hover:bg-danger/80"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
