"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, getAuthUser } from "@/lib/authCookies";
import { clearCart, useCartState, useCartSummary } from "@/lib/cartStore";
import CityStateDropdown from "@/components/CityStateDropdown";
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
  // Live shipping quote — call backend whenever pincode + cart change.
  // `paise` is what the customer will be charged for delivery; we add it
  // to the subtotal + GST so the "Estimated total" matches the Razorpay
  // amount exactly. Falls back to null until a valid pincode is entered.
  const [shippingQuote, setShippingQuote] = useState({
    loading: false,
    paise: null,
    error: "",
  });

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
      // GET /user/me returns the sanitized user FLAT; PUT /user/me wraps
      // it under `user`. Handle both shapes so the cart works regardless
      // of which call's response is in our hands.
      const candidate =
        (Array.isArray(profileRes?.addresses) && profileRes.addresses) ||
        (Array.isArray(profileRes?.user?.addresses) && profileRes.user.addresses) ||
        [];
      setSavedAddresses(candidate);
      setAddressState({ loading: false, error: "" });
    } catch {
      setSavedAddresses([]);
      setAddressState({ loading: false, error: "Could not load saved addresses." });
    }
  }

  useEffect(() => {
    loadProfileAddresses();
  }, []);

  // Debounced shipping quote — triggers as soon as the user enters a
  // valid 6-digit pincode, and re-fires when the basket or pincode
  // changes. We hit `/api/v1/checkout/shipping-quote` which mirrors the
  // same Shiprocket logic the real `/orders` POST runs, so what we show
  // here equals what Razorpay charges.
  useEffect(() => {
    const pincode = checkoutForm.pincode.trim();
    if (!PINCODE_REGEX.test(pincode) || carts.shopping.length === 0) {
      setShippingQuote({ loading: false, paise: null, error: "" });
      return;
    }
    setShippingQuote((s) => ({ ...s, loading: true, error: "" }));
    const handle = setTimeout(async () => {
      try {
        const items = carts.shopping.map((c) => ({
          item_id: c.item_id,
          quantity: Number(c.quantity) || 1,
        }));
        const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api/v1").replace(/\/$/, "");
        const res = await fetch(
          `${apiBase}/checkout/shipping-quote`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items, delivery_pincode: pincode }),
          },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setShippingQuote({
            loading: false,
            paise: null,
            error: body?.message || "Couldn't fetch shipping for this pincode.",
          });
          return;
        }
        setShippingQuote({
          loading: false,
          paise: Number(body?.shipping_total_paise) || 0,
          error: "",
        });
      } catch (err) {
        setShippingQuote({
          loading: false,
          paise: null,
          error: err?.message || "Couldn't fetch shipping.",
        });
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [checkoutForm.pincode, carts.shopping]);

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
        setSubmitState({ loading: false, error: "", success: "" });
        toast.info("Please login to submit quotation.");
        router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!quotationForm.name.trim()) throw new Error("Name is required for quotation.");
      if (!quotationForm.phone.trim()) throw new Error("Phone number is required for quotation.");
      const normalizedPhone = normalizePhoneInput(quotationForm.phone);
      if (!PHONE_REGEX.test(normalizedPhone)) throw new Error("Please enter a valid 10-digit mobile number.");
      if (!quotationForm.email.trim()) throw new Error("Email is required so we can send you the quotation.");
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
      setQuotationForm({
        name: "",
        phone: "",
        email: "",
        note: "",
      });
      const successMessage = response.message || "Quotation sent successfully.";
      setSubmitState({
        loading: false,
        error: "",
        success: successMessage,
      });
      if (response.emailStatus === undefined || response.emailStatus === "sent") {
        toast.success(successMessage);
      } else {
        toast.warning(successMessage);
      }
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
          className="rounded-2xl border border-border bg-surface p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
        >
          <h3 className="text-xl font-semibold text-text-strong">Send Quotation Request</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            We will use your quotation cart items and contact details to generate a quote.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={quotationForm.name}
              onChange={(e) => setQuotationForm((current) => ({ ...current, name: e.target.value }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={quotationForm.phone}
              onChange={(e) => setQuotationForm((current) => ({ ...current, phone: e.target.value }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <input
              type="email"
              placeholder="Email address (required)"
              value={quotationForm.email}
              onChange={(e) => setQuotationForm((current) => ({ ...current, email: e.target.value }))}
              required
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <textarea
              placeholder="Add note for quotation request"
              value={quotationForm.note}
              onChange={(e) => setQuotationForm((current) => ({ ...current, note: e.target.value }))}
              className="min-h-28 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm font-medium text-text outline-none focus:border-primary"
            />
          </div>

          {submitState.error ? <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{submitState.error}</p> : null}
          {submitState.success ? (
            <p className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">{submitState.success}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitState.loading || carts.quotation.length === 0}
            className="mt-6 w-full cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.2)]"
          >
            {submitState.loading ? "Sending..." : "Send Quotation"}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleCheckout}
          className="rounded-2xl border border-border bg-surface p-6 shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
        >
          <h3 className="text-xl font-semibold text-text-strong">Shopping Checkout</h3>
          <p className="mt-2 text-sm leading-6 text-muted">Fill in your details and pay securely via Razorpay.</p>

          {(() => {
            const shippingRupees = shippingQuote.paise != null ? shippingQuote.paise / 100 : 0;
            const preTax = shoppingTotal + shippingRupees;
            const gst = Math.round(preTax * 0.18);
            const total = Math.round(preTax + gst);
            return (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Items ({shoppingCount})</span>
                  <span className="font-medium text-text-strong">
                    {formatCurrency(shoppingTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>Shipping</span>
                  <span className="font-medium text-text-strong">
                    {shippingQuote.loading
                      ? "Calculating…"
                      : shippingQuote.paise != null
                      ? formatCurrency(shippingRupees)
                      : "Enter pincode →"}
                  </span>
                </div>
                {shippingQuote.error ? (
                  <p className="-mt-2 text-[11px] text-danger">{shippingQuote.error}</p>
                ) : null}
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>GST (18%)</span>
                  <span className="font-medium text-text-strong">{formatCurrency(gst)}</span>
                </div>
                <div className="border-t border-border pt-3" />
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-text-strong">
                    {shippingQuote.paise != null ? "Total" : "Estimated total"}
                  </span>
                  <span className="text-lg font-bold text-text-strong">
                    {formatCurrency(total)}
                  </span>
                </div>
                {shippingQuote.paise == null ? (
                  <p className="text-[11px] leading-4 text-muted">
                    Final total updates once you enter a valid delivery pincode.
                  </p>
                ) : null}
              </div>
            );
          })()}

          <div className="mt-5 rounded-xl border border-border bg-primary-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text">Saved Addresses</p>
              <button
                type="button"
                onClick={loadProfileAddresses}
                className="rounded-lg border border-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
              >
                {addressState.loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {addressState.error ? (
              <p className="mt-2 text-xs text-danger">{addressState.error}</p>
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
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-strong bg-surface text-muted"
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
              <p className="mt-2 text-xs text-muted">
                No saved addresses found. Add one in{" "}
                <Link href="/profile" className="font-semibold text-primary underline">
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
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <input
              type="tel"
              placeholder="Phone number"
              value={checkoutForm.phone}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, phone: e.target.value.replace(/[^\d+]/g, "") }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <input
              type="email"
              placeholder="Email address"
              value={checkoutForm.email}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, email: e.target.value }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Address line 1"
              value={checkoutForm.line1}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, line1: e.target.value }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Address line 2"
              value={checkoutForm.line2}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, line2: e.target.value }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <CityStateDropdown
              cityValue={checkoutForm.city}
              stateValue={checkoutForm.state}
              onChange={(loc) =>
                setCheckoutForm((current) => ({
                  ...current,
                  city: loc.city || "",
                  state: loc.state || "",
                }))
              }
              placeholderCity="City"
              placeholderState="State"
            />
            <input
              type="text"
              placeholder="Pincode"
              value={checkoutForm.pincode}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, pincode: e.target.value }))}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-medium text-text outline-none focus:border-primary"
            />
            <textarea
              placeholder="Order note"
              value={checkoutForm.notes}
              onChange={(e) => setCheckoutForm((current) => ({ ...current, notes: e.target.value }))}
              className="min-h-24 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm font-medium text-text outline-none focus:border-primary"
            />
          </div>

          {checkoutState.error ? (
            <p className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{checkoutState.error}</p>
          ) : null}
          {checkoutState.success ? (
            <div className="mt-4 rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
              <div>{checkoutState.success}</div>
              {checkoutState.orderNumber ? <div className="mt-1 font-semibold">Order: {checkoutState.orderNumber}</div> : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={checkoutState.loading || carts.shopping.length === 0}
            className="mt-6 w-full cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.2)]"
          >
            {checkoutState.loading ? "Creating Order..." : "Pay with Razorpay"}
          </button>
        </form>
      )}
    </aside>
  );
}

