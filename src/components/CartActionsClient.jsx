"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, getAuthUser } from "@/lib/authCookies";
import { clearCart, useCartState, useCartSummary } from "@/lib/cartStore";
import { createShoppingOrder, fetchMyProfile, submitQuotationRequest, verifyRazorpayPayment } from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { makeIdempotencyKey } from "@/lib/idempotencyKey";
import { toast } from "sonner";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PINCODE_REGEX = /^\d{6}$/;

function normalizePhoneInput(phone) {
  return String(phone || "").replace(/\D/g, "");
}

export default function CartActionsClient({ activeCart = "shopping" }) {
  const router = useRouter();
  const carts = useCartState();
  const { shoppingCount, shoppingTotal } = useCartSummary();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState("");
  const [addressState, setAddressState] = useState({ loading: false, error: "" });
  const [quotationForm, setQuotationForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });
  const [submitState, setSubmitState] = useState({ loading: false, error: "", success: "" });
  const [checkoutState, setCheckoutState] = useState({ loading: false, error: "", success: "", orderNumber: "" });

  useEffect(() => {
    const user = getAuthUser();
    if (!user) return;
    setQuotationForm((current) => ({
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
      note: current.note,
    }));
    setCheckoutForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
    }));
  }, []);

  async function loadProfileAddresses() {
    try {
      setAddressState({ loading: true, error: "" });
      const token = getAuthToken();
      if (!token) {
        setSavedAddresses([]);
        setAddressState({ loading: false, error: "" });
        return;
      }
      const profileRes = await fetchMyProfile(token);
      const addresses = Array.isArray(profileRes?.user?.addresses)
        ? profileRes.user.addresses
        : [];
      setSavedAddresses(addresses);
      setAddressState({ loading: false, error: "" });
    } catch {
      setSavedAddresses([]);
      setAddressState({ loading: false, error: "Could not load saved addresses." });
    }
  }

  useEffect(() => {
    loadProfileAddresses();
  }, []);

  function applySavedAddress(indexValue) {
    const index = Number(indexValue);
    if (Number.isNaN(index) || !savedAddresses[index]) return;
    const selected = savedAddresses[index];
    setCheckoutForm((current) => ({
      ...current,
      line1: selected.line1 || "",
      line2: selected.line2 || "",
      city: selected.city || "",
      state: selected.state || "",
      pincode: selected.pincode || "",
    }));
  }

  function validateEmailIfProvided(email) {
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
  }

  async function handleSubmitQuotation(e) {
    e.preventDefault();
    setSubmitState({ loading: true, error: "", success: "" });

    try {
      if (!getAuthUser()) {
        toast.info("Please login to submit quotation.");
        router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!quotationForm.name.trim()) throw new Error("Name is required for quotation.");
      if (!quotationForm.phone.trim()) throw new Error("Phone number is required for quotation.");
      const normalizedPhone = normalizePhoneInput(quotationForm.phone);
      if (!PHONE_REGEX.test(normalizedPhone)) throw new Error("Please enter a valid 10-digit mobile number.");
      validateEmailIfProvided(quotationForm.email.trim());
      if (carts.quotation.length === 0) throw new Error("Add items to quotation basket first.");

      const payload = {
        customer: {
          name: quotationForm.name.trim(),
          phone: normalizedPhone,
          email: quotationForm.email.trim() || null,
        },
        note: quotationForm.note.trim() || null,
        items: carts.quotation,
      };

      const idempotencyKey = makeIdempotencyKey("quotation-requests", payload);
      const response = await submitQuotationRequest(payload, { idempotencyKey });
      clearCart("quotation");
      setSubmitState({
        loading: false,
        error: "",
        success: response.message || "Quotation request submitted successfully.",
      });
      toast.success(response.message || "Quotation request submitted successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to submit quotation request.");
      setSubmitState({
        loading: false,
        error: error.message || "Failed to submit quotation request.",
        success: "",
      });
    }
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutState({ loading: true, error: "", success: "", orderNumber: "" });

    try {
      if (!getAuthUser()) {
        toast.info("Please login to continue checkout.");
        router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!checkoutForm.name.trim()) throw new Error("Name is required for checkout.");
      if (!checkoutForm.phone.trim()) throw new Error("Phone number is required for checkout.");
      const normalizedPhone = normalizePhoneInput(checkoutForm.phone);
      if (!PHONE_REGEX.test(normalizedPhone)) throw new Error("Please enter a valid 10-digit mobile number.");
      validateEmailIfProvided(checkoutForm.email.trim());
      if (!checkoutForm.line1.trim()) throw new Error("Address line 1 is required.");
      if (!checkoutForm.city.trim()) throw new Error("City is required.");
      if (!checkoutForm.state.trim()) throw new Error("State is required.");
      if (!checkoutForm.pincode.trim()) throw new Error("Pincode is required.");
      if (!PINCODE_REGEX.test(checkoutForm.pincode.trim())) throw new Error("Please enter a valid 6-digit pincode.");
      if (carts.shopping.length === 0) throw new Error("Add items to shopping cart first.");

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const orderPayload = {
        customer: {
          name: checkoutForm.name.trim(),
          phone: normalizedPhone,
          email: checkoutForm.email.trim() || null,
        },
        shipping_address: {
          line1: checkoutForm.line1.trim(),
          line2: checkoutForm.line2.trim() || null,
          city: checkoutForm.city.trim(),
          state: checkoutForm.state.trim(),
          pincode: checkoutForm.pincode.trim(),
        },
        notes: checkoutForm.notes.trim() || null,
        items: carts.shopping,
      };

      const idempotencyKey = makeIdempotencyKey("orders", orderPayload);
      const response = await createShoppingOrder(orderPayload, { idempotencyKey });

      const rzConfig = response.razorpay;
      const orderNumber = response.order?.order_number || "";
      if (!rzConfig?.order_id) throw new Error("Razorpay order was not created. Please try again.");

      const rzp = new window.Razorpay({
        key: rzConfig.key_id,
        amount: rzConfig.amount,
        currency: rzConfig.currency,
        name: rzConfig.name,
        description: rzConfig.description,
        order_id: rzConfig.order_id,
        prefill: rzConfig.prefill,
        theme: { color: "#ff4f86" },
        handler: async function (paymentResponse) {
          try {
            const verifyPayload = {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            };
            const verifyIdempotencyKey = makeIdempotencyKey("orders/verify-payment", verifyPayload);
            const verifyRes = await verifyRazorpayPayment(verifyPayload, { idempotencyKey: verifyIdempotencyKey });
            clearCart("shopping");
            setCheckoutState({
              loading: false,
              error: "",
              success: verifyRes.message || "Payment successful! Your order is confirmed.",
              orderNumber,
            });
            toast.success(verifyRes.message || "Payment successful! Your order is confirmed.");
          } catch (verifyErr) {
            toast.error(verifyErr.message || "Payment verification failed. Contact support.");
            setCheckoutState({
              loading: false,
              error: verifyErr.message || "Payment verification failed. Contact support.",
              success: "",
              orderNumber,
            });
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment was cancelled. You can try again.");
            setCheckoutState({
              loading: false,
              error: "Payment was cancelled. You can try again.",
              success: "",
              orderNumber,
            });
          },
        },
      });

      rzp.on("payment.failed", function (failResponse) {
        toast.error(failResponse?.error?.description || "Payment failed. Please try again.");
        setCheckoutState({
          loading: false,
          error: failResponse?.error?.description || "Payment failed. Please try again.",
          success: "",
          orderNumber,
        });
      });

      rzp.open();
    } catch (error) {
      toast.error(error.message || "Failed to create order.");
      setCheckoutState({
        loading: false,
        error: error.message || "Failed to create order.",
        success: "",
        orderNumber: "",
      });
    }
  }

  return (
    <aside className="space-y-6">
      {activeCart === "quotation" ? (
        <form
          onSubmit={handleSubmitQuotation}
          className="rounded-2xl border border-[#efe7eb] bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
        >
          <h3 className="text-xl font-semibold text-slate-900">Send Quotation Request</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            We will use your quotation cart items and contact details to generate a quote.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={quotationForm.name}
              onChange={(e) => setQuotationForm((current) => ({ ...current, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={quotationForm.phone}
              onChange={(e) => setQuotationForm((current) => ({ ...current, phone: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <input
              type="email"
              placeholder="Email address"
              value={quotationForm.email}
              onChange={(e) => setQuotationForm((current) => ({ ...current, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <textarea
              placeholder="Add note for quotation request"
              value={quotationForm.note}
              onChange={(e) => setQuotationForm((current) => ({ ...current, note: e.target.value }))}
              className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
          </div>

          {submitState.error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitState.error}</p> : null}
          {submitState.success ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{submitState.success}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitState.loading || carts.quotation.length === 0}
            className="mt-6 w-full cursor-pointer rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,79,134,0.2)]"
          >
            {submitState.loading ? "Sending..." : "Send Quotation"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleCheckout}
          className="rounded-2xl border border-[#efe7eb] bg-white p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
        >
          <h3 className="text-xl font-semibold text-slate-900">Shopping Checkout</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">Fill in your details and pay securely via Razorpay.</p>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Items</span>
              <span className="font-semibold text-slate-800">{shoppingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Total</span>
              <span className="font-semibold text-slate-800">{formatCurrency(shoppingTotal)}</span>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#f1e4ea] bg-[#fcf7fa] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Saved Addresses</p>
              <button
                type="button"
                onClick={loadProfileAddresses}
                className="rounded-lg border border-[#ffd3e3] px-3 py-1.5 text-xs font-semibold text-[#ff4f86]"
              >
                {addressState.loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {addressState.error ? (
              <p className="mt-2 text-xs text-red-500">{addressState.error}</p>
            ) : null}
            {savedAddresses.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {savedAddresses.map((address, index) => (
                  <button
                    key={`saved-addr-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedAddressIndex(String(index));
                      applySavedAddress(String(index));
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      selectedAddressIndex === String(index)
                        ? "border-[#ff4f86] bg-[#fff1f6] text-[#ff4f86]"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <div className="font-semibold">{address.label || "Address"}</div>
                    <div className="mt-0.5">
                      {[address.line1, address.city, address.state, address.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                No saved addresses found. Add one in{" "}
                <Link href="/profile" className="font-semibold text-[#ff4f86] underline">
                  Profile
                </Link>
                .
              </p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={checkoutForm.name}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={checkoutForm.phone}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, phone: e.target.value.replace(/[^\d+]/g, "") }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <input
              type="email"
              placeholder="Email address"
              value={checkoutForm.email}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <input
              type="text"
              placeholder="Address line 1"
              value={checkoutForm.line1}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, line1: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <input
              type="text"
              placeholder="Address line 2"
              value={checkoutForm.line2}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, line2: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="City"
                value={checkoutForm.city}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, city: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
              <input
                type="text"
                placeholder="State"
                value={checkoutForm.state}
                onChange={(e) => setCheckoutForm((current) => ({ ...current, state: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
              />
            </div>
            <input
              type="text"
              placeholder="Pincode"
              value={checkoutForm.pincode}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, pincode: e.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
            <textarea
              placeholder="Order note"
              value={checkoutForm.notes}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, notes: e.target.value }))}
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#ff4f86]"
            />
          </div>

          {checkoutState.error ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{checkoutState.error}</p>
          ) : null}
          {checkoutState.success ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div>{checkoutState.success}</div>
              {checkoutState.orderNumber ? <div className="mt-1 font-semibold">Order: {checkoutState.orderNumber}</div> : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={checkoutState.loading || carts.shopping.length === 0}
            className="mt-6 w-full cursor-pointer rounded-xl bg-[#ff4f86] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,79,134,0.2)]"
          >
            {checkoutState.loading ? "Creating Order..." : "Pay with Razorpay"}
          </button>
        </form>
      )}
    </aside>
  );
}

