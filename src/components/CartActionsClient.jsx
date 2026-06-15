"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getAuthToken, getAuthUser } from "@/lib/authCookies";
import { clearCart, getEventDate, useCartState, useCartSummary } from "@/lib/cartStore";
import CityStateDropdown from "@/components/CityStateDropdown";
import {
  createShoppingOrder,
  fetchMyCredit,
  fetchMyProfile,
  submitQuotationRequest,
  updateMyProfile,
  validateCheckoutCoupon,
  verifyRazorpayPayment,
} from "@/lib/api";
import { formatCurrency } from "@/lib/shopUi";
import { makeIdempotencyKey } from "@/lib/idempotencyKey";
import { toast } from "sonner";
import { Check, Loader2, Lock, MapPin, Pencil, Plus, Receipt, ShieldCheck, Tag, Wallet, X } from "lucide-react";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PINCODE_REGEX = /^\d{6}$/;
const ADDRESS_LABELS = ["Home", "Work", "Wedding Venue", "Other"];

const inputClass =
  "h-11 w-full rounded-xl border border-border-strong bg-surface px-3.5 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-subtle";

function normalizePhoneInput(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function formatAddressLine(address) {
  return [address?.line1, address?.line2, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(", ");
}

export default function CartActionsClient({ activeCart = "shopping" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const carts = useCartState();
  const { shoppingCount, shoppingTotal } = useCartSummary();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressState, setAddressState] = useState({ loading: false, error: "" });
  const [addressMode, setAddressMode] = useState("select"); // "select" | "new"
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [savingAddress, setSavingAddress] = useState(false);
  const didInitAddress = useRef(false);

  const [quotationForm, setQuotationForm] = useState({ name: "", phone: "", email: "", note: "" });
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
  // Live shipping quote — call backend whenever pincode + cart change so the
  // "Total" matches the Razorpay amount exactly. Null until a valid pincode.
  const [shippingQuote, setShippingQuote] = useState({ loading: false, paise: null, error: "" });
  // Store credit (Task 9) — auto-applied, partial-friendly. User can untick
  // "Use store credit" to pay the full amount via Razorpay instead.
  const [creditBalancePaise, setCreditBalancePaise] = useState(0);
  const [applyCredit, setApplyCredit] = useState(true);
  // Coupon — previewed via /checkout/validate-coupon (no redemption). The
  // applied coupon's code is sent in the order payload; the server re-validates
  // and re-prices authoritatively, so this is display-only.
  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState({ loading: false, error: "" });
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount_paise, free_shipping }

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return undefined;
    let cancelled = false;
    fetchMyCredit(token)
      .then((res) => {
        if (!cancelled) setCreditBalancePaise(Number(res?.balance_paise) || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  function applyAddressToForm(address) {
    if (!address) return;
    setCheckoutForm((current) => ({
      ...current,
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    }));
  }

  async function loadProfileAddresses() {
    try {
      setAddressState({ loading: true, error: "" });
      const token = getAuthToken();
      if (!token) {
        setSavedAddresses([]);
        setAddressMode("new");
        setAddressState({ loading: false, error: "" });
        return;
      }
      const profileRes = await fetchMyProfile(token);
      // GET /user/me returns the sanitized user FLAT; PUT /user/me wraps it
      // under `user`. Handle both shapes so the cart works either way.
      const candidate =
        (Array.isArray(profileRes?.addresses) && profileRes.addresses) ||
        (Array.isArray(profileRes?.user?.addresses) && profileRes.user.addresses) ||
        [];
      setSavedAddresses(candidate);
      setAddressState({ loading: false, error: "" });
      if (candidate.length > 0 && !didInitAddress.current) {
        // Pre-select the default (first saved) address — like Amazon/Flipkart.
        didInitAddress.current = true;
        setSelectedAddressIndex(0);
        setAddressMode("select");
        applyAddressToForm(candidate[0]);
      } else if (candidate.length === 0) {
        setAddressMode("new");
      }
    } catch {
      setSavedAddresses([]);
      setAddressState({ loading: false, error: "Could not load saved addresses." });
    }
  }

  useEffect(() => {
    loadProfileAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced shipping quote — fires once a valid 6-digit pincode is set and
  // re-fires when the basket or pincode changes.
  useEffect(() => {
    const pincode = checkoutForm.pincode.trim();
    if (!PINCODE_REGEX.test(pincode) || carts.shopping.length === 0) {
      setShippingQuote({ loading: false, paise: null, error: "" });
      return;
    }
    setShippingQuote((s) => ({ ...s, loading: true, error: "" }));
    const handle = setTimeout(async () => {
      try {
        const items = carts.shopping.map((c) => ({ item_id: c.item_id, quantity: Number(c.quantity) || 1 }));
        const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api/v1").replace(/\/$/, "");
        const res = await fetch(`${apiBase}/checkout/shipping-quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, delivery_pincode: pincode }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setShippingQuote({ loading: false, paise: null, error: body?.message || "Couldn't fetch shipping for this pincode." });
          return;
        }
        setShippingQuote({ loading: false, paise: Number(body?.shipping_total_paise) || 0, error: "" });
      } catch (err) {
        setShippingQuote({ loading: false, paise: null, error: err?.message || "Couldn't fetch shipping." });
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [checkoutForm.pincode, carts.shopping]);

  /* ── Address book actions ─────────────────────────────── */
  function selectSavedAddress(index) {
    setSelectedAddressIndex(index);
    setAddressMode("select");
    setEditingIndex(null);
    applyAddressToForm(savedAddresses[index]);
  }

  function startAddAddress() {
    setAddressMode("new");
    setEditingIndex(null);
    setAddressLabel("Home");
    setCheckoutForm((current) => ({ ...current, line1: "", line2: "", city: "", state: "", pincode: "" }));
  }

  function startEditAddress(index) {
    const address = savedAddresses[index];
    if (!address) return;
    setAddressMode("new");
    setEditingIndex(index);
    setAddressLabel(address.label || "Home");
    applyAddressToForm(address);
  }

  function cancelAddressEntry() {
    if (savedAddresses.length === 0) return;
    setAddressMode("select");
    setEditingIndex(null);
    if (selectedAddressIndex == null) {
      selectSavedAddress(0);
    } else {
      applyAddressToForm(savedAddresses[selectedAddressIndex]);
    }
  }

  async function handleSaveAddress() {
    const token = getAuthToken();
    if (!token) {
      toast.info("Please login to save addresses.");
      return;
    }
    if (!checkoutForm.line1.trim()) return toast.error("Address line 1 is required.");
    if (!checkoutForm.city.trim()) return toast.error("City is required.");
    if (!checkoutForm.state.trim()) return toast.error("State is required.");
    if (!PINCODE_REGEX.test(checkoutForm.pincode.trim())) return toast.error("Please enter a valid 6-digit pincode.");

    const address = {
      label: addressLabel || "Home",
      line1: checkoutForm.line1.trim(),
      line2: checkoutForm.line2.trim(),
      city: checkoutForm.city.trim(),
      state: checkoutForm.state.trim(),
      pincode: checkoutForm.pincode.trim(),
    };
    const nextList =
      editingIndex != null
        ? savedAddresses.map((a, i) => (i === editingIndex ? address : a))
        : [...savedAddresses, address];

    try {
      setSavingAddress(true);
      const result = await updateMyProfile(token, { addresses: nextList });
      const serverList = (Array.isArray(result?.user?.addresses) && result.user.addresses) || nextList;
      setSavedAddresses(serverList);
      const newIndex = editingIndex != null ? editingIndex : serverList.length - 1;
      didInitAddress.current = true;
      setSelectedAddressIndex(newIndex);
      applyAddressToForm(serverList[newIndex]);
      setEditingIndex(null);
      setAddressMode("select");
      toast.success(editingIndex != null ? "Address updated." : "Address saved.");
    } catch (e) {
      toast.error(e?.message || "Couldn't save address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function makeDefaultAddress(index) {
    const token = getAuthToken();
    if (!token || index <= 0 || !savedAddresses[index]) return;
    const reordered = [savedAddresses[index], ...savedAddresses.filter((_, i) => i !== index)];
    setSavedAddresses(reordered);
    setSelectedAddressIndex(0);
    applyAddressToForm(reordered[0]);
    try {
      await updateMyProfile(token, { addresses: reordered });
      toast.success("Default address updated.");
    } catch (e) {
      toast.error(e?.message || "Couldn't update default address.");
      loadProfileAddresses();
    }
  }

  function validateEmailIfProvided(email) {
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) throw new Error("Please enter a valid email address.");
  }

  /* ── Coupon apply / remove ────────────────────────────── */
  // Clear an applied coupon whenever the shopping basket changes — the
  // discount was previewed against the previous items and may no longer hold.
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponState({ loading: false, error: "" });
  }, [carts.shopping]);

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) {
      setCouponState({ loading: false, error: "Enter a coupon code." });
      return;
    }
    if (!getAuthUser()) {
      toast.info("Please login to apply a coupon.");
      router.push(`/login?returnTo=${encodeURIComponent(loginReturnTo)}`);
      return;
    }
    if (carts.shopping.length === 0) {
      setCouponState({ loading: false, error: "Add items to your cart first." });
      return;
    }
    setCouponState({ loading: true, error: "" });
    try {
      const items = carts.shopping.map((c) => ({ item_id: c.item_id, quantity: Number(c.quantity) || 1 }));
      const res = await validateCheckoutCoupon({
        coupon_code: code,
        items,
        shipping_paise: shippingQuote.paise != null ? shippingQuote.paise : 0,
      });
      if (!res?.ok) {
        setAppliedCoupon(null);
        setCouponState({ loading: false, error: res?.message || res?.reason || "Coupon could not be applied." });
        return;
      }
      setAppliedCoupon({
        code: res.code,
        discount_paise: Number(res.discount_paise) || 0,
        free_shipping: !!res.free_shipping,
      });
      setCouponInput(res.code);
      setCouponState({ loading: false, error: "" });
      toast.success(res.message || "Coupon applied.");
    } catch (err) {
      setAppliedCoupon(null);
      setCouponState({ loading: false, error: err?.message || "Couldn't apply coupon." });
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponState({ loading: false, error: "" });
  }

  /* ── Quotation submit ─────────────────────────────────── */
  async function handleSubmitQuotation(e) {
    e.preventDefault();
    setSubmitState({ loading: true, error: "", success: "" });
    try {
      if (!getAuthUser()) {
        setSubmitState({ loading: false, error: "", success: "" });
        toast.info("Please login to submit quotation.");
        const qs = searchParams.toString();
        const returnTo = qs ? `${pathname}?${qs}` : pathname;
        router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
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
        // Pass the customer's chosen event date so vendor-availability routing
        // checks against the wedding date (not "today"). Falls back server-side.
        event_date: getEventDate() || null,
        items: carts.quotation,
      };

      const idempotencyKey = makeIdempotencyKey("quotation-requests", payload);
      const response = await submitQuotationRequest(payload, { idempotencyKey });
      clearCart("quotation");
      setQuotationForm({ name: "", phone: "", email: "", note: "" });
      const successMessage = response.message || "Quotation sent successfully.";
      setSubmitState({ loading: false, error: "", success: successMessage });
      if (response.emailStatus === undefined || response.emailStatus === "sent") {
        toast.success(successMessage);
      } else {
        toast.warning(successMessage);
      }
    } catch (error) {
      toast.error(error.message || "Failed to submit quotation request.");
      setSubmitState({ loading: false, error: error.message || "Failed to submit quotation request.", success: "" });
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

  /* ── Checkout ─────────────────────────────────────────── */
  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutState({ loading: true, error: "", success: "", orderNumber: "" });
    try {
      if (!getAuthUser()) {
        toast.info("Please login to continue checkout.");
        const qs = searchParams.toString();
        const returnTo = qs ? `${pathname}?${qs}` : pathname;
        router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (!checkoutForm.name.trim()) throw new Error("Name is required for checkout.");
      if (!checkoutForm.phone.trim()) throw new Error("Phone number is required for checkout.");
      const normalizedPhone = normalizePhoneInput(checkoutForm.phone);
      if (!PHONE_REGEX.test(normalizedPhone)) throw new Error("Please enter a valid 10-digit mobile number.");
      validateEmailIfProvided(checkoutForm.email.trim());
      if (!checkoutForm.line1.trim()) throw new Error("Please add or select a delivery address.");
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
        apply_credit: applyCredit,
        coupon_code: appliedCoupon?.code || null,
        items: carts.shopping,
      };

      const idempotencyKey = makeIdempotencyKey("orders", orderPayload);
      const response = await createShoppingOrder(orderPayload, { idempotencyKey });

      const orderId = response.order?.order_id || response.order?._id || "";
      const orderNumber = response.order?.order_number || "";

      // Fully paid by store credit — no Razorpay step. Land on the order page.
      if (response.fully_paid_by_credit) {
        clearCart("shopping");
        setCheckoutState({ loading: false, error: "", success: "Order placed using store credit!", orderNumber });
        toast.success("Order placed using store credit!");
        if (orderId) router.push(`/orders/${orderId}?placed=1`);
        return;
      }

      const rzConfig = response.razorpay;
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
            // Task 8 — land the customer on their order page after payment.
            if (orderId) router.push(`/orders/${orderId}?placed=1`);
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
            setCheckoutState({ loading: false, error: "Payment was cancelled. You can try again.", success: "", orderNumber });
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
      setCheckoutState({ loading: false, error: error.message || "Failed to create order.", success: "", orderNumber: "" });
    }
  }

  /* ── Quotation panel ──────────────────────────────────── */
  if (activeCart === "quotation") {
    const quoteItems = carts.quotation.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const disabled = submitState.loading || carts.quotation.length === 0;
    return (
      <form
        onSubmit={handleSubmitQuotation}
        className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4720a]/10 text-[#d4720a]">
            <Receipt className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-text-strong">Request a quotation</h3>
            <p className="text-xs text-muted">{quoteItems} item{quoteItems === 1 ? "" : "s"} in this request</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-surface-muted px-3.5 py-3 text-xs leading-5 text-muted">
          Share your details and we&apos;ll prepare a tailored quote for your selected items and email it to you.
        </p>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              placeholder="Your name"
              value={quotationForm.name}
              onChange={(e) => setQuotationForm((c) => ({ ...c, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={quotationForm.phone}
              onChange={(e) => setQuotationForm((c) => ({ ...c, phone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={quotationForm.email}
              onChange={(e) => setQuotationForm((c) => ({ ...c, email: e.target.value }))}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Note (optional)</label>
            <textarea
              placeholder="Anything specific we should know?"
              value={quotationForm.note}
              onChange={(e) => setQuotationForm((c) => ({ ...c, note: e.target.value }))}
              className="min-h-24 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        {submitState.error ? (
          <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{submitState.error}</p>
        ) : null}
        {submitState.success ? (
          <p className="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{submitState.success}</p>
        ) : null}

        <button
          type="submit"
          disabled={disabled}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(255,79,134,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitState.loading ? "Submitting…" : "Submit quotation"}
        </button>
      </form>
    );
  }

  /* ── Shopping checkout panel ──────────────────────────── */
  // Mirror the server's paise-based math (POST /orders): discount the subtotal,
  // zero shipping on a free-shipping coupon, then GST on the discounted base.
  const subtotalPaise = Math.round(shoppingTotal * 100);
  const couponDiscountPaise = appliedCoupon
    ? Math.min(Number(appliedCoupon.discount_paise) || 0, subtotalPaise)
    : 0;
  const couponFreeShipping = !!appliedCoupon?.free_shipping;
  const rawShippingPaise = shippingQuote.paise != null ? shippingQuote.paise : 0;
  const shippingPaise = couponFreeShipping ? 0 : rawShippingPaise;
  const shippingRupees = shippingPaise / 100;
  const discountedSubtotalPaise = Math.max(0, subtotalPaise - couponDiscountPaise);
  const preTaxPaise = discountedSubtotalPaise + shippingPaise;
  const gstPaise = Math.round((preTaxPaise * 18) / 100);
  const gst = gstPaise / 100;
  const totalPaise = preTaxPaise + gstPaise;
  // Store credit (Task 9): auto-applied up to the available balance.
  const creditAppliedPaise = applyCredit ? Math.min(creditBalancePaise, totalPaise) : 0;
  const payableRupees = Math.max(0, (totalPaise - creditAppliedPaise) / 100);
  const orderSavings = carts.shopping.reduce((sum, item) => {
    const original = Number(item.price) || 0;
    const final = Number(item.final_price) || original;
    if (item.is_discount_active && original > final) return sum + (original - final) * (Number(item.quantity) || 0);
    return sum;
  }, 0);
  const checkoutDisabled = checkoutState.loading || carts.shopping.length === 0;
  const accountUser = getAuthUser();
  // Recipient shown on saved-address cards — read from the account (stable) so
  // it does not mutate live while the user edits the contact fields above.
  const recipientName = accountUser?.name || checkoutForm.name.trim() || "You";
  const recipientPhone = normalizePhoneInput(accountUser?.phone) || normalizePhoneInput(checkoutForm.phone);
  const loginReturnTo = (() => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();

  return (
    <form onSubmit={handleCheckout} className="space-y-5">
      {/* Price details */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-subtle">Price details</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Items ({shoppingCount})</span>
            <span className="font-medium text-text-strong">{formatCurrency(shoppingTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Shipping</span>
            <span className="font-medium text-text-strong">
              {couponFreeShipping
                ? "Free"
                : shippingQuote.loading
                ? "Calculating…"
                : shippingQuote.paise != null
                ? shippingRupees === 0
                  ? "Free"
                  : formatCurrency(shippingRupees)
                : "Enter pincode"}
            </span>
          </div>
          {shippingQuote.error ? <p className="-mt-1.5 text-[11px] text-danger">{shippingQuote.error}</p> : null}
          {couponDiscountPaise > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted">
                <Tag className="h-4 w-4 text-primary" />
                Coupon ({appliedCoupon?.code})
              </span>
              <span className="font-semibold text-success">– {formatCurrency(couponDiscountPaise / 100)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-sm text-muted">
            <span>GST (18%)</span>
            <span className="font-medium text-text-strong">{formatCurrency(gst)}</span>
          </div>

          {/* Coupon entry */}
          {appliedCoupon ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm font-semibold text-success">
                <Tag className="h-4 w-4" />
                {appliedCoupon.code}
                {appliedCoupon.free_shipping ? (
                  <span className="text-[11px] font-medium text-muted">· Free shipping</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-danger"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Have a coupon?"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  className="h-10 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-sm font-semibold uppercase tracking-wide text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponState.loading}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {couponState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Apply
                </button>
              </div>
              {couponState.error ? <p className="mt-1.5 text-[11px] text-danger">{couponState.error}</p> : null}
            </div>
          )}

          {creditBalancePaise > 0 ? (
            <label className="flex cursor-pointer items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-muted">
                <input
                  type="checkbox"
                  checked={applyCredit}
                  onChange={(e) => setApplyCredit(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <Wallet className="h-4 w-4 text-primary" />
                Use store credit
                <span className="text-[11px] text-subtle">
                  (₹{(creditBalancePaise / 100).toLocaleString("en-IN")} available)
                </span>
              </span>
              <span className="font-semibold text-success">
                {creditAppliedPaise > 0 ? `– ${formatCurrency(creditAppliedPaise / 100)}` : "—"}
              </span>
            </label>
          ) : null}
          <div className="border-t border-dashed border-border pt-3" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-text-strong">
              {shippingQuote.paise != null ? "Total payable" : "Estimated total"}
            </span>
            <span className="text-xl font-bold text-text-strong">{formatCurrency(payableRupees)}</span>
          </div>
        </div>
        {orderSavings > 0 ? (
          <p className="mt-3 rounded-xl bg-success/10 px-3.5 py-2 text-xs font-semibold text-success">
            You save {formatCurrency(orderSavings)} on this order 🎉
          </p>
        ) : null}
        {shippingQuote.paise == null ? (
          <p className="mt-2 text-[11px] leading-4 text-subtle">Final total updates once you enter a valid delivery pincode.</p>
        ) : null}
      </div>

      {/* Contact details */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <h3 className="text-base font-semibold text-text-strong">Contact details</h3>
        <div className="mt-4 space-y-3.5">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              type="text"
              placeholder="Full name"
              value={checkoutForm.name}
              onChange={(e) => setCheckoutForm((c) => ({ ...c, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                placeholder="Mobile number"
                value={checkoutForm.phone}
                onChange={(e) => setCheckoutForm((c) => ({ ...c, phone: e.target.value.replace(/[^\d+]/g, "") }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                placeholder="Email (optional)"
                value={checkoutForm.email}
                onChange={(e) => setCheckoutForm((c) => ({ ...c, email: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-text-strong">
            <MapPin className="h-5 w-5 text-primary" />
            Delivery address
          </h3>
          {addressState.loading ? <Loader2 className="h-4 w-4 animate-spin text-subtle" /> : null}
        </div>

        {addressState.error ? <p className="mt-2 text-xs text-danger">{addressState.error}</p> : null}

        {!accountUser ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 px-4 py-3">
            <p className="text-xs font-medium text-muted">Log in to pick from your saved addresses.</p>
            <button
              type="button"
              onClick={() => router.push(`/login?returnTo=${encodeURIComponent(loginReturnTo)}`)}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              Log in
            </button>
          </div>
        ) : null}

        {/* Saved address picker */}
        {addressMode === "select" && savedAddresses.length > 0 ? (
          <div className="mt-4 space-y-2.5">
            {savedAddresses.map((address, index) => {
              const selected = selectedAddressIndex === index;
              return (
                <div
                  key={`saved-addr-${index}`}
                  className={`rounded-2xl border p-3.5 transition ${
                    selected ? "border-primary bg-primary-soft/50 ring-1 ring-primary/30" : "border-border-strong bg-surface hover:border-primary/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectSavedAddress(index)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-primary" : "border-border-strong"
                      }`}
                    >
                      {selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                          {address.label || "Address"}
                        </span>
                        {index === 0 ? (
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            Default
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 block text-sm font-semibold text-text-strong">{recipientName}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted">{formatAddressLine(address)}</span>
                      {recipientPhone ? (
                        <span className="mt-0.5 block text-xs text-subtle">Phone: {recipientPhone}</span>
                      ) : null}
                    </span>
                  </button>
                  {selected ? (
                    <div className="mt-2.5 flex items-center gap-3 pl-8">
                      <button
                        type="button"
                        onClick={() => startEditAddress(index)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      {index !== 0 ? (
                        <button
                          type="button"
                          onClick={() => makeDefaultAddress(index)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition hover:text-text"
                        >
                          <Check className="h-3 w-3" /> Set as default
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <button
              type="button"
              onClick={startAddAddress}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong px-4 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary-soft/40"
            >
              <Plus className="h-4 w-4" /> Add a new address
            </button>
          </div>
        ) : (
          /* Manual entry / edit form */
          <div className="mt-4 space-y-3.5">
            <div>
              <label className={labelClass}>Address type</label>
              <div className="flex flex-wrap gap-2">
                {ADDRESS_LABELS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAddressLabel(opt)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      addressLabel === opt
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-strong bg-surface text-muted hover:border-primary/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Address line 1</label>
              <input
                type="text"
                placeholder="House no, building, street"
                value={checkoutForm.line1}
                onChange={(e) => setCheckoutForm((c) => ({ ...c, line1: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Address line 2 (optional)</label>
              <input
                type="text"
                placeholder="Area, landmark"
                value={checkoutForm.line2}
                onChange={(e) => setCheckoutForm((c) => ({ ...c, line2: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City &amp; state</label>
              <CityStateDropdown
                cityValue={checkoutForm.city}
                stateValue={checkoutForm.state}
                onChange={(loc) => setCheckoutForm((c) => ({ ...c, city: loc.city || "", state: loc.state || "" }))}
                placeholderCity="City"
                placeholderState="State"
              />
            </div>
            <div>
              <label className={labelClass}>Pincode</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit pincode"
                value={checkoutForm.pincode}
                onChange={(e) => setCheckoutForm((c) => ({ ...c, pincode: e.target.value.replace(/\D/g, "") }))}
                className={inputClass}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={savingAddress}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_22px_rgba(255,79,134,0.2)] transition hover:bg-primary-hover disabled:opacity-50"
              >
                {savingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editingIndex != null ? "Update address" : "Save address"}
              </button>
              {savedAddresses.length > 0 ? (
                <button
                  type="button"
                  onClick={cancelAddressEntry}
                  className="rounded-xl border border-border-strong px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        )}

        <div>
          <label className={`${labelClass} mt-4`}>Order note (optional)</label>
          <textarea
            placeholder="Delivery instructions, gate code, etc."
            value={checkoutForm.notes}
            onChange={(e) => setCheckoutForm((c) => ({ ...c, notes: e.target.value }))}
            className="min-h-20 w-full rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
      </div>

      {/* Status + Pay */}
      {checkoutState.error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{checkoutState.error}</p>
      ) : null}
      {checkoutState.success ? (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          <div>{checkoutState.success}</div>
          {checkoutState.orderNumber ? <div className="mt-1 font-semibold">Order: {checkoutState.orderNumber}</div> : null}
        </div>
      ) : null}

      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-6">
        <button
          type="submit"
          disabled={checkoutDisabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_14px_28px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkoutState.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
          {checkoutState.loading
            ? "Processing…"
            : payableRupees <= 0
            ? "Place order (store credit)"
            : `Pay ${formatCurrency(payableRupees)}`}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium text-subtle">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Secured by Razorpay · UPI, cards &amp; net-banking
        </p>
      </div>
    </form>
  );
}
