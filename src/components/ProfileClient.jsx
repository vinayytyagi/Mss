"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthUser, getAuthToken, saveAuthCookies, clearAuthCookies } from "@/lib/authCookies";
import { usePathname, useRouter } from "next/navigation";
import { updateMyProfile, deleteMyAccount, fetchMyServiceOrders, fetchMyCredit, createWalletTopupOrder, verifyWalletTopupPayment } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import CityStateDropdown from "@/components/CityStateDropdown";
import Dropdown from "@/components/ui/Dropdown";
import { useWishlistState } from "@/lib/wishlistStore";
import { formatLakhs } from "@/lib/utils";
import { isValidEmail } from "@/lib/authValidation";
import { toast } from "sonner";
import {
  Check,
  Heart,
  IndianRupee,
  MapPin,
  Package,
  Pencil,
  Plus,
  Settings,
  Star,
  Trash2,
  UserRound,
  X,
  ArrowRight,
  Receipt,
  Wallet,
  Calendar,
  Users,
  Sparkles,
  Clock,
} from "lucide-react";

/* ── Icons ─────────────────────────────────────────── */
function UserIcon() {
  return <UserRound className="h-6 w-6" />;
}

function PencilIcon() {
  return <Pencil className="h-4 w-4" />;
}

function PackageIcon() {
  return <Package className="h-5 w-5" />;
}

function HeartIcon() {
  return <Heart className="h-5 w-5" />;
}

function LocationIcon() {
  return <MapPin className="h-5 w-5" />;
}

function CheckIcon() {
  return <Check className="h-4 w-4" />;
}

function XIcon() {
  return <X className="h-4 w-4" />;
}

function PlusIcon() {
  return <Plus className="h-4 w-4" />;
}

function SettingsIcon() {
  return <Settings className="h-4 w-4" />;
}

/* ── Helpers ────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(amount) {
  return formatLakhs(amount);
}

// Service-order customer-facing statuses (deriveCustomerStatus in serviceOrder.js).
const SERVICE_STATUS_TONE = {
  received: "bg-warning/15 text-warning-strong",
  sourcing: "bg-warning/15 text-warning-strong",
  quote_ready: "bg-primary-soft text-primary",
  awaiting_payment: "bg-warning/15 text-warning-strong",
  confirmed: "bg-info/10 text-info",
  delivered: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

// Profile tab slugs — each tab is its own deep-linkable route
// (/profile, /profile/wallet, /profile/quotations, …). Used to derive the
// active tab from the URL so tabs are shareable / back-button friendly.
const PROFILE_TAB_IDS = ["profile", "wallet", "orders", "quotations", "wedding", "budget", "addresses", "settings"];

// Left accent-strip colour per quotation status (mirrors SERVICE_STATUS_TONE).
const STATUS_BAR_TONE = {
  received: "bg-warning",
  sourcing: "bg-warning",
  quote_ready: "bg-primary",
  awaiting_payment: "bg-warning",
  confirmed: "bg-info",
  delivered: "bg-success",
  completed: "bg-success",
  cancelled: "bg-danger",
};

// Shopping-order status → badge tone + left accent-strip colour.
const ORDER_STATUS_TONE = {
  Paid: "bg-success/10 text-success",
  Confirmed: "bg-info/10 text-info",
  Processing: "bg-warning/15 text-warning-strong",
  Shipped: "bg-info/10 text-info",
  Delivered: "bg-success/10 text-success",
  Completed: "bg-success/10 text-success",
  Pending: "bg-warning/15 text-warning-strong",
  Cancelled: "bg-danger/10 text-danger",
  "Payment Failed": "bg-danger/10 text-danger",
};
const ORDER_BAR_TONE = {
  Paid: "bg-success",
  Confirmed: "bg-info",
  Processing: "bg-warning",
  Shipped: "bg-info",
  Delivered: "bg-success",
  Completed: "bg-success",
  Pending: "bg-warning",
  Cancelled: "bg-danger",
  "Payment Failed": "bg-danger",
};

const MAX_BUDGET_PER_STEP = 5000000;
const BUDGET_STEP = 1000;

const ADDRESS_LABEL_OPTIONS = [
  { value: "Home", label: "Home" },
  { value: "Work", label: "Work" },
  { value: "Wedding Venue", label: "Wedding Venue" },
  { value: "Other", label: "Other" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w.charAt(0).toUpperCase()).slice(0, 2).join("");
}

/* ── Main Component ────────────────────────────────── */
export default function ProfileClient({ initialProfile = null, initialOrders = [], hasServerSession = false }) {
  const router = useRouter();
  const user = useAuthUser(initialProfile || null);
  const [profile, setProfile] = useState(initialProfile);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [orders] = useState(initialOrders);
  const [loading] = useState(false);
  const pathname = usePathname();
  // The active tab is derived from the URL (/profile/<slug>), so each tab is a
  // dedicated, shareable page. The bare /profile path is the "profile" tab.
  const activeTab = (() => {
    const seg = (pathname || "/profile").replace(/^\/profile\/?/, "").split("/")[0];
    return PROFILE_TAB_IDS.includes(seg) ? seg : "profile";
  })();
  const [serviceOrders, setServiceOrders] = useState(null);
  const [serviceOrdersLoading, setServiceOrdersLoading] = useState(false);
  const [creditInfo, setCreditInfo] = useState(null); // { balance_paise, ledger }
  const [topupAmount, setTopupAmount] = useState(""); // rupees, as typed
  const [adding, setAdding] = useState(false);
  const wishlist = useWishlistState();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetchMyCredit(token)
      .then((res) => setCreditInfo(res || null))
      .catch(() => {});
  }, []);

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

  async function refreshCredit() {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetchMyCredit(token);
      setCreditInfo(res || null);
    } catch {
      /* keep stale balance on failure */
    }
  }

  async function handleAddMoney() {
    const rupees = Number(topupAmount);
    if (!rupees || rupees <= 0) {
      toast.error("Please enter an amount greater than zero.");
      return;
    }
    if (!Number.isInteger(rupees)) {
      toast.error("Please enter a whole rupee amount.");
      return;
    }
    if (rupees < 10) {
      toast.error("Minimum top-up is ₹10.");
      return;
    }
    if (rupees > 100000) {
      toast.error("Maximum top-up is ₹1,00,000.");
      return;
    }
    const amountPaise = Math.round(rupees * 100);
    setAdding(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }
      const { razorpay } = await createWalletTopupOrder(token, amountPaise);
      if (!razorpay?.order_id) throw new Error("Could not start payment. Please try again.");
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const rzp = new window.Razorpay({
        key: razorpay.key_id,
        order_id: razorpay.order_id,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "MyShaadiStore Wallet",
        description: "Add money to wallet",
        theme: { color: "#ff4f86" },
        handler: async (resp) => {
          try {
            await verifyWalletTopupPayment(token, {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              amount_paise: amountPaise,
            });
            await refreshCredit();
            setTopupAmount("");
            toast.success("Money added to your wallet!");
          } catch (err) {
            toast.error(err?.message || "Payment succeeded but crediting failed. Please contact support.");
          }
        },
      });
      rzp.on("payment.failed", (resp) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (e) {
      toast.error(e?.message || "Could not add money. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  // Edit states
  const [editingBasic, setEditingBasic] = useState(false);
  const [editName, setEditName] = useState(initialProfile?.name || "");
  const [editEmail, setEditEmail] = useState(initialProfile?.email || "");
  const [editImage, setEditImage] = useState(initialProfile?.image_url || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Address states
  const [addresses, setAddresses] = useState(initialProfile?.addresses || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newAddress, setNewAddress] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  // Wedding edit
  const [editingWedding, setEditingWedding] = useState(false);
  const [editWeddingDate, setEditWeddingDate] = useState(initialProfile?.onboarding?.wedding_date || "");
  const [editGuestsCount, setEditGuestsCount] = useState(initialProfile?.onboarding?.guests_count || "");
  const [editVenueLocation, setEditVenueLocation] = useState(initialProfile?.onboarding?.venue_location || "");
  const [editingBudget, setEditingBudget] = useState(false);
  const [editBudgetAllocations, setEditBudgetAllocations] = useState(initialProfile?.onboarding?.budget_allocations || []);

  async function handleSaveBasic() {
    setSaveMsg("");
    if (editName.trim().length > 80) {
      toast.error("Name must be 80 characters or fewer.");
      return;
    }
    const trimmedEmail = editEmail.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSaving(true);
    try {
      const token = getAuthToken();
      const result = await updateMyProfile(token, { name: editName, email: editEmail, image_url: editImage });
      setProfile(result.user);
      // Update cookie so header reflects changes
      saveAuthCookies({ token, user: result.user });
      setEditingBasic(false);
      setSaveMsg("Profile updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWedding() {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = getAuthToken();
      const payload = {
        onboarding: {
          ...profile.onboarding,
          wedding_date: editWeddingDate,
          guests_count: editGuestsCount,
          venue_location: editVenueLocation,
        }
      };
      
      const result = await updateMyProfile(token, payload);
      setProfile(result.user);
      saveAuthCookies({ token, user: result.user });
      setEditingWedding(false);
      setSaveMsg("Wedding details updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBudget() {
    setSaving(true);
    setSaveMsg("");
    try {
      const token = getAuthToken();
      const total = editBudgetAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const payload = {
        onboarding: {
          ...profile.onboarding,
          budget_allocations: editBudgetAllocations.map((item) => ({
            ...item,
            amount: Number(item.amount) || 0,
          })),
          budget_total: total,
        },
      };
      const result = await updateMyProfile(token, payload);
      setProfile(result.user);
      saveAuthCookies({ token, user: result.user });
      setEditingBudget(false);
      setSaveMsg("Budget updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAddresses(updatedAddresses) {
    setSaving(true);
    try {
      const token = getAuthToken();
      const result = await updateMyProfile(token, { addresses: updatedAddresses });
      setProfile(result.user);
      setAddresses(result.user.addresses || []);
      setEditingIndex(null);
      setSaveMsg("Addresses updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      setSaveMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startAddAddress() {
    setEditingIndex(null);
    setNewAddress({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
    setShowAddForm(true);
  }

  function startEditAddress(index) {
    const address = addresses[index];
    if (!address) return;
    setEditingIndex(index);
    setNewAddress({
      label: address.label || "Home",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    });
    setShowAddForm(true);
  }

  function handleSubmitAddress() {
    if (!newAddress.line1.trim()) return toast.error("Address line 1 is required.");
    if (!newAddress.city.trim() || !newAddress.state.trim()) return toast.error("City and state are required.");
    if (!/^\d{6}$/.test(newAddress.pincode.trim())) return toast.error("Please enter a valid 6-digit pincode.");
    const entry = {
      label: newAddress.label || "Home",
      line1: newAddress.line1.trim(),
      line2: newAddress.line2.trim(),
      city: newAddress.city.trim(),
      state: newAddress.state.trim(),
      pincode: newAddress.pincode.trim(),
    };
    const updated =
      editingIndex != null
        ? addresses.map((a, i) => (i === editingIndex ? entry : a))
        : [...addresses, entry];
    setAddresses(updated);
    setNewAddress({ label: "Home", line1: "", line2: "", city: "", state: "", pincode: "" });
    setShowAddForm(false);
    setEditingIndex(null);
    handleSaveAddresses(updated);
  }

  // Default = first in the array (Amazon/Flipkart style). Promoting an address
  // to default just moves it to the front and re-persists the list.
  function handleSetDefault(index) {
    if (index <= 0 || !addresses[index]) return;
    const updated = [addresses[index], ...addresses.filter((_, i) => i !== index)];
    setAddresses(updated);
    handleSaveAddresses(updated);
  }

  function handleRemoveAddress(index) {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    handleSaveAddresses(updated);
  }

  // Lazy-load the customer's service orders the first time the tab is opened.
  useEffect(() => {
    if ((activeTab !== "quotations" && activeTab !== "profile") || serviceOrders !== null) return;
    const token = getAuthToken();
    if (!token) {
      setServiceOrders([]);
      return;
    }
    setServiceOrdersLoading(true);
    fetchMyServiceOrders(token)
      .then((res) => setServiceOrders(Array.isArray(res?.orders) ? res.orders : []))
      .catch(() => setServiceOrders([]))
      .finally(() => setServiceOrdersLoading(false));
  }, [activeTab, serviceOrders]);

  /* ── Not logged in ─────────────────────────────────── */
  if (!user && !hasServerSession) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-xl border border-border bg-surface/80 px-8 py-16 shadow-[0_8px_40px_rgba(0,0,0,0.04)] backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-accent text-primary-foreground shadow-[0_20px_50px_rgba(255,79,134,0.3)]">
            <UserIcon />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-text">My Profile</h1>
          <p className="mt-2 text-muted">Please log in to view your profile.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_40px_rgba(255,79,134,0.28)] transition hover:bg-primary-hover"
          >
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </main>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <UserIcon /> },
    { id: "wallet", label: "Wallet", icon: <Wallet className="h-4 w-4" /> },
    { id: "orders", label: "Orders", icon: <PackageIcon /> },
    { id: "quotations", label: "Quotations", icon: <Receipt className="h-4 w-4" /> },
    { id: "wedding", label: "Wedding details", icon: <HeartIcon /> },
    { id: "budget", label: "Budget", icon: <IndianRupee className="h-4 w-4" /> },
    { id: "addresses", label: "Addresses", icon: <LocationIcon /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  const onboarding = profile?.onboarding || {};
  const budgetAllocations = Array.isArray(onboarding.budget_allocations) ? onboarding.budget_allocations : [];
  const editableBudgetTotal = editBudgetAllocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const recentOrders = orders.slice(0, 5);

  // Account-overview derived stats (Profile tab dashboard).
  const wishlistCount = (wishlist?.journey?.length || 0) + (wishlist?.shopping?.length || 0);
  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const creditBalance = (creditInfo?.balance_paise || 0) / 100;
  const quotationsCount = Array.isArray(serviceOrders) ? serviceOrders.length : null;
  const memberSince = formatDate(profile?.created_at);
  const defaultCity = addresses?.[0]?.city || onboarding.venue_location || "";
  const daysToWedding = (() => {
    if (!onboarding.wedding_date) return null;
    const d = new Date(onboarding.wedding_date);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    return days >= 0 ? days : null;
  })();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero / Avatar section */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-linear-to-br from-primary/5 via-white to-primary-soft p-6 shadow-[0_8px_40px_rgba(0,0,0,0.04)] sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-primary-accent/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-primary to-primary-accent text-2xl font-extrabold text-primary-foreground shadow-[0_20px_50px_rgba(255,79,134,0.3)]">
              {profile?.image_url ? (
                <Image
                  src={profile.image_url}
                  alt={profile.name || "Profile"}
                  width={160}
                  height={160}
                  sizes="80px"
                  quality={95}
                  className="h-full w-full object-cover"
                  unoptimized={typeof profile.image_url === "string" && profile.image_url.startsWith("data:")}
                />
              ) : (
                getInitials(profile?.name)
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                router.push("/profile");
                setEditingBasic(true);
                requestAnimationFrame(() => {
                  document.getElementById("profile-photo-upload")?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                });
              }}
              className="absolute -bottom-1 -right-1 rounded-full border-2 border-primary-foreground bg-surface px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary shadow-md transition hover:bg-primary-soft"
            >
              {profile?.image_url ? "Edit" : "Photo"}
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-text">
              {profile?.name || "User"}
            </h1>
            <p className="mt-0.5 text-sm text-text-strong">+91 {profile?.phone || user?.phone || ""}</p>
            {profile?.email && <p className="text-sm text-text-strong">{profile.email}</p>}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-muted">
                <Clock className="h-3 w-3" /> Member since {memberSince}
              </span>
              {defaultCity ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-muted">
                  <MapPin className="h-3 w-3" /> {defaultCity}
                </span>
              ) : null}
              {creditBalance > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
                  <Wallet className="h-3 w-3" /> {formatCurrency(creditBalance)} credit
                </span>
              ) : null}
            </div>
          </div>
          {daysToWedding != null ? (
            <div className="sm:ml-auto flex flex-col items-center rounded-xl border border-primary/30 bg-primary-soft/70 px-5 py-3 text-center">
              <p className="text-3xl font-black leading-none text-primary">{daysToWedding}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary/80">days to go</p>
            </div>
          ) : (
            <div className="sm:ml-auto rounded-xl border border-primary-soft bg-surface/80 px-3 py-2 text-xs font-medium text-primary">
              Account dashboard
            </div>
          )}
        </div>
      </div>

      {/* Success message */}
      {saveMsg && (
        <div className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm font-medium text-success animate-in fade-in duration-300">
          {saveMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="no-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface/80 p-1 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "profile" ? "/profile" : `/profile/${tab.id}`}
            scroll={false}
            className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(255,79,134,0.25)]"
                : "text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            {tab.icon} {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* ── Wallet Tab ───────────────────────────────────── */}
        {activeTab === "wallet" && (
          <div className="space-y-4">
            {/* Balance card */}
            <div className="rounded-xl border border-primary/30 bg-linear-to-br from-primary-soft to-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-subtle">
                    <Wallet className="h-4 w-4 text-primary" /> Wallet balance
                  </p>
                  <p className="mt-1 text-3xl font-black text-primary">
                    {formatCurrency((creditInfo?.balance_paise || 0) / 100)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-subtle">
                Auto-applied at checkout. Refunds from cancellations &amp; returns land here too.
              </p>
            </div>

            {/* Add money panel */}
            <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
              <h2 className="text-base font-semibold text-text">Add money</h2>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(String(amt))}
                    className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      Number(topupAmount) === amt
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border-strong text-muted hover:bg-surface-muted hover:text-text"
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-subtle">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-xl border border-border-strong bg-surface py-3 pl-8 pr-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMoney}
                  disabled={adding}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:opacity-60"
                >
                  {adding ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add money
                </button>
              </div>
            </div>

            {/* Transaction ledger */}
            <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
              <h2 className="text-base font-semibold text-text">Transactions</h2>
              {Array.isArray(creditInfo?.ledger) && creditInfo.ledger.length ? (
                <div className="scrollbar-soft mt-4 max-h-80 divide-y divide-border overflow-y-auto pr-1">
                  {creditInfo.ledger.map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text">
                          {e.reason || (e.amount_paise >= 0 ? "Credit added" : "Credit used")}
                          {e.source?.order_number ? ` · ${e.source.order_number}` : ""}
                        </p>
                        <p className="text-xs text-subtle">{formatDate(e.created_at)}</p>
                      </div>
                      <span className={`shrink-0 font-semibold ${e.amount_paise >= 0 ? "text-success" : "text-muted"}`}>
                        {e.amount_paise >= 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(e.amount_paise) / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-surface-muted px-4 py-5 text-center text-sm text-muted">
                  No wallet transactions yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Profile Tab ──────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Account snapshot — quick stats, each links to its section */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Orders", value: orders.length, sub: totalSpent ? `${formatCurrency(totalSpent)} spent` : "Shopping orders", href: "/profile/orders", icon: <Package className="h-5 w-5" /> },
                { label: "Quotations", value: quotationsCount == null ? "—" : quotationsCount, sub: "Service requests", href: "/profile/quotations", icon: <Receipt className="h-5 w-5" /> },
                { label: "Wishlist", value: wishlistCount, sub: "Saved favourites", href: "/favourites", icon: <Heart className="h-5 w-5" /> },
                { label: "Wallet credit", value: formatCurrency(creditBalance), sub: "Auto-applied at checkout", href: "/profile/wallet", icon: <Wallet className="h-5 w-5" /> },
              ].map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="group rounded-xl border border-border bg-surface/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(255,79,134,0.10)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">{s.icon}</span>
                    <ArrowRight className="h-4 w-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-3 text-2xl font-black text-text">{s.value}</p>
                  <p className="text-sm font-semibold text-text-strong">{s.label}</p>
                  <p className="mt-0.5 text-xs text-subtle">{s.sub}</p>
                </Link>
              ))}
            </div>

            {/* Personal information */}
            <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text">Personal information</h2>
              {!editingBasic && (
                <button
                  onClick={() => setEditingBasic(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                >
                  <PencilIcon /> Edit
                </button>
              )}
            </div>

            {editingBasic ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-subtle">Name</label>
                  <input
                    type="text"
                    maxLength={80}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-subtle">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-subtle">Phone</label>
                  <input
                    type="text"
                    value={`+91 ${profile?.phone || ""}`}
                    disabled
                    className="mt-1 w-full rounded-xl border border-border-strong bg-surface-muted px-4 py-3 text-sm text-subtle"
                  />
                  <p className="mt-1 text-xs text-subtle">Phone number cannot be changed</p>
                </div>
                <div id="profile-photo-upload" className="pt-2">
                  <ImageUpload
                    label="Profile Photo"
                    initialUrl={editImage}
                    onUploadComplete={(url) => setEditImage(url)}
                  />
                  <p className="mt-2 text-xs text-muted">
                    We resize photos for upload. If cloud storage is offline, a JPEG preview is saved on your profile for this device.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleSaveBasic}
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <CheckIcon />}
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingBasic(false);
                      setEditName(profile?.name || "");
                      setEditEmail(profile?.email || "");
                      setEditImage(profile?.image_url || "");
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-strong px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted"
                  >
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Full Name</p>
                  <p className="mt-1 text-sm font-bold text-text">{profile?.name || "—"}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Phone</p>
                  <p className="mt-1 text-sm font-bold text-text">+91 {profile?.phone || "—"}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Email</p>
                  <p className="mt-1 text-sm font-bold text-text">{profile?.email || "Not provided"}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Account Status</p>
                  <p className="mt-1 text-sm font-bold text-success">{profile?.status || "Active"}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Saved Addresses</p>
                  <p className="mt-1 text-sm font-bold text-text">{addresses.length}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Orders Placed</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-text">
                    <Package className="h-4 w-4 text-primary" />
                    {orders.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Wedding Month</p>
                  <p className="mt-1 text-sm font-bold text-text">
                    {onboarding.wedding_month ||
                      (onboarding.wedding_date
                        ? new Date(onboarding.wedding_date).toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })
                        : "—")}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Current Budget</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-text">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    {onboarding.budget_total ? formatCurrency(onboarding.budget_total) : "—"}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">Member Since</p>
                  <p className="mt-1 text-sm font-bold text-text">{memberSince}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted/80 px-5 py-4">
                  <p className="text-xs text-subtle">City</p>
                  <p className="mt-1 text-sm font-bold text-text">{defaultCity || "—"}</p>
                </div>
              </div>
            )}
            </div>

            {/* Your wedding at a glance */}
            <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-text">
                  <Sparkles className="h-4 w-4 text-primary" /> Your wedding at a glance
                </h2>
                <Link
                  href="/profile/wedding"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                >
                  <PencilIcon /> Edit
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary-soft to-white px-5 py-4">
                  <p className="text-xs text-subtle">Wedding date</p>
                  <p className="mt-1 text-sm font-bold text-text">
                    {onboarding.wedding_date ? formatDate(onboarding.wedding_date) : onboarding.wedding_month || "Not set"}
                  </p>
                  {daysToWedding != null ? (
                    <p className="mt-0.5 text-xs font-semibold text-primary">{daysToWedding} days to go</p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary-soft to-white px-5 py-4">
                  <p className="text-xs text-subtle">Venue location</p>
                  <p className="mt-1 text-sm font-bold text-text">{onboarding.venue_location || "—"}</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary-soft to-white px-5 py-4">
                  <p className="text-xs text-subtle">Guest count</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-text">
                    <Users className="h-4 w-4 text-primary" /> {onboarding.guests_count || "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary-soft to-white px-5 py-4">
                  <p className="text-xs text-subtle">Total budget</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-text">
                    <IndianRupee className="h-4 w-4 text-primary" /> {onboarding.budget_total ? formatCurrency(onboarding.budget_total) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders Tab ──────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-text">My Orders</h2>
                <p className="mt-0.5 text-sm text-muted">Your shopping orders, payments and delivery status.</p>
              </div>
              <div className="flex items-center gap-3">
                {orders.length ? (
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                    {orders.length} order{orders.length === 1 ? "" : "s"}
                  </span>
                ) : null}
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary-hover"
                >
                  View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/70 px-8 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Package className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-bold text-text">No orders yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Browse the shop and your orders will show up here with live payment + delivery status.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Start shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recentOrders.map((order) => {
                  const tone = ORDER_STATUS_TONE[order.status] || "bg-surface-muted text-muted";
                  const bar = ORDER_BAR_TONE[order.status] || "bg-border";
                  const itemCount = Array.isArray(order.items)
                    ? order.items.reduce((n, it) => n + (Number(it.quantity) || 1), 0)
                    : null;
                  return (
                    <Link
                      key={order._id}
                      href={`/orders/${order._id}`}
                      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(255,79,134,0.10)]"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} aria-hidden />
                      <div className="p-5 pl-6">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
                            <Package className="h-3 w-3" />
                            {order.order_number}
                          </span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted" />
                            {formatDate(order.created_at)}
                          </span>
                          {itemCount ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-muted" />
                              {itemCount} item{itemCount === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">Order total</p>
                            <p className="mt-0.5 text-xl font-extrabold text-text">{formatCurrency(order.total_amount)}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-1.5">
                            View
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Quotations Tab (a customer quotation request = a service order) ── */}
        {activeTab === "quotations" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-text">My Quotations</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Track every request — from inquiry to the final price our team compiles for you.
                </p>
              </div>
              {serviceOrders?.length ? (
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  {serviceOrders.length} request{serviceOrders.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>

            {serviceOrdersLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-surface-muted/60" />
                ))}
              </div>
            ) : !serviceOrders || serviceOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/70 px-8 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Receipt className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-bold text-text">No quotations yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Add services to your quote basket and submit a request — our team sources quotes and shares the best price with you.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Explore services <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {serviceOrders.map((o) => {
                  const tone = SERVICE_STATUS_TONE[o.status] || "bg-surface-muted text-muted";
                  const bar = STATUS_BAR_TONE[o.status] || "bg-border";
                  const hasQuote = o.quote_total != null;
                  return (
                    <Link
                      key={o.order_id}
                      href={`/service-orders/${o.quotation_id}`}
                      className="group relative block overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(255,79,134,0.10)]"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} aria-hidden />
                      <div className="p-5 pl-6">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
                            <Receipt className="h-3 w-3" />
                            {o.order_id || "—"}
                          </span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
                            {o.status_label}
                          </span>
                        </div>

                        <h3 className="mt-3 truncate text-lg font-bold capitalize text-text">
                          {o.service_type || "Quotation"}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
                          {o.event_date ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted" />
                              {formatDate(o.event_date)}
                            </span>
                          ) : null}
                          {o.event_city ? (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted" />
                              {o.event_city}
                            </span>
                          ) : null}
                          {o.guest_count ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-muted" />
                              {o.guest_count} guests
                            </span>
                          ) : null}
                          {o.item_count ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-muted" />
                              {o.item_count} item{o.item_count === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
                              {hasQuote ? "Quote total" : "Final quote"}
                            </p>
                            <p className={hasQuote ? "mt-0.5 text-xl font-extrabold text-text" : "mt-0.5 text-sm font-semibold text-muted"}>
                              {hasQuote ? formatCurrency(o.quote_total) : "Awaiting quote"}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition group-hover:gap-1.5">
                            View
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Wedding Details Tab ─────────────────────────── */}
        {activeTab === "wedding" && (
          <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text">Wedding details</h2>
              {!editingWedding && (
                <button
                  onClick={() => setEditingWedding(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                >
                  <PencilIcon /> Edit
                </button>
              )}
            </div>

            {editingWedding ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-subtle">Wedding Date</label>
                    <input
                      type="date"
                      value={editWeddingDate?.split("T")[0] || ""}
                      onChange={(e) => setEditWeddingDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-subtle">Guest Count</label>
                    <input
                      type="number"
                      value={editGuestsCount}
                      onChange={(e) => setEditGuestsCount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-text outline-none transition focus:border-primary focus:ring focus:ring-primary/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-subtle">Venue Location</label>
                    <div className="mt-1">
                      <CityStateDropdown
                        value={editVenueLocation}
                        onChange={(loc) => setEditVenueLocation(loc.label)}
                        placeholderCity="Search venue city…"
                        placeholderState="Select state"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/30 bg-primary-soft/60 px-4 py-3 text-sm text-muted">
                  Budget allocations are managed in the <span className="font-bold text-primary">Budget</span> tab.
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <button
                    onClick={handleSaveWedding}
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <CheckIcon />}
                    Save Wedding Details
                  </button>
                  <button
                    onClick={() => {
                      setEditingWedding(false);
                      const currentOnboarding = profile?.onboarding || {};
                      setEditWeddingDate(currentOnboarding.wedding_date || "");
                      setEditGuestsCount(currentOnboarding.guests_count || "");
                      setEditVenueLocation(currentOnboarding.venue_location || "");
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-strong px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted"
                  >
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-linear-to-br from-primary-soft to-white px-5 py-4 border border-primary/20">
                    <p className="text-xs text-subtle">Wedding Date</p>
                    <p className="mt-1 text-sm font-bold text-text">
                      {onboarding.wedding_date ? formatDate(onboarding.wedding_date) :
                       onboarding.wedding_month || "Not set"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-primary-soft to-white px-5 py-4 border border-primary/20">
                    <p className="text-xs text-subtle">Venue Location</p>
                    <p className="mt-1 text-sm font-bold text-text">{onboarding.venue_location || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-primary-soft to-white px-5 py-4 border border-primary/20">
                    <p className="text-xs text-subtle">Guest Count</p>
                    <p className="mt-1 text-sm font-bold text-text">{onboarding.guests_count || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-linear-to-br from-primary-soft to-white px-5 py-4 border border-primary/20">
                    <p className="text-xs text-subtle">Total Budget</p>
                    <p className="mt-1 text-sm font-bold text-text">
                      {onboarding.budget_total ? formatCurrency(onboarding.budget_total) : "—"}
                    </p>
                  </div>
                </div>

              </>
            )}
          </div>
        )}

        {activeTab === "budget" && (
          <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text">Budget planner</h2>
              {!editingBudget && (
                <button
                  onClick={() => setEditingBudget(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                >
                  <PencilIcon /> Edit
                </button>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-primary/30 bg-linear-to-br from-primary-soft to-white px-5 py-4">
              <p className="text-xs uppercase tracking-widest text-subtle">Total Budget</p>
              <p className="mt-1 text-2xl font-black text-primary">
                {formatCurrency(editingBudget ? editableBudgetTotal : onboarding.budget_total || 0)}
              </p>
            </div>

            {editingBudget ? (
              <div className="mt-6 space-y-4">
                {editBudgetAllocations.length === 0 ? (
                  <p className="rounded-2xl bg-surface-muted px-4 py-5 text-center text-sm text-muted">
                    No budget breakdown found yet. Update journey step budgets first.
                  </p>
                ) : (
                  editBudgetAllocations.map((alloc, idx) => (
                    <div key={`${alloc.step_id || alloc.slug || "step"}-${idx}`} className="rounded-2xl border border-border bg-surface-muted/60 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-text">{alloc.title || alloc.slug || "Step"}</div>
                        <div className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-text">
                          {formatCurrency(alloc.amount)}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[210px_1fr]">
                        <input
                          type="number"
                          min="0"
                          max={Math.max(Number(alloc.max_budget) || 0, Number(alloc.amount) || 0, MAX_BUDGET_PER_STEP)}
                          step={BUDGET_STEP}
                          value={Number(alloc.amount) || 0}
                          onChange={(e) => {
                            const maxBudget = Math.max(Number(alloc.max_budget) || 0, Number(alloc.amount) || 0, MAX_BUDGET_PER_STEP);
                            const value = Math.max(0, Math.min(maxBudget, Number(e.target.value) || 0));
                            setEditBudgetAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: value } : item))
                            );
                          }}
                          className="h-11 rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-text outline-none focus:border-primary"
                        />
                        <input
                          type="range"
                          min="0"
                          max={Math.max(Number(alloc.max_budget) || 0, Number(alloc.amount) || 0, MAX_BUDGET_PER_STEP)}
                          step={BUDGET_STEP}
                          value={Number(alloc.amount) || 0}
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            setEditBudgetAllocations((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, amount: value } : item))
                            );
                          }}
                          className="w-full cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  ))
                )}

                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={handleSaveBudget}
                    disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:opacity-60"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <CheckIcon />}
                    Save Budget
                  </button>
                  <button
                    onClick={() => {
                      setEditingBudget(false);
                      setEditBudgetAllocations(profile?.onboarding?.budget_allocations || []);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-strong px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted"
                  >
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                {budgetAllocations.length === 0 ? (
                  <p className="rounded-2xl bg-surface-muted px-4 py-5 text-center text-sm text-muted">
                    No budget allocations found yet.
                  </p>
                ) : (
                  budgetAllocations.map((alloc, i) => (
                    <div key={`${alloc.step_id || alloc.slug || "step"}-${i}`} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
                      <span className="text-sm font-medium text-muted">{alloc.title || alloc.slug || "Step"}</span>
                      <span className="text-sm font-bold text-text-strong">{formatCurrency(alloc.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Addresses Tab ───────────────────────────────── */}
        {activeTab === "addresses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text">
                Saved Addresses ({addresses.length})
              </h2>
              <button
                onClick={startAddAddress}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover"
              >
                <PlusIcon /> Add Address
              </button>
            </div>

            {/* Address cards */}
            {addresses.length === 0 && !showAddForm && (
              <div className="rounded-xl border border-border bg-surface/80 px-8 py-16 text-center shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur">
                <LocationIcon />
                <p className="mt-3 text-sm text-muted">No saved addresses</p>
                <p className="text-xs text-subtle">Add an address so you can check out faster!</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {addresses.map((addr, i) => (
                <div
                  key={i}
                  className={`flex flex-col rounded-2xl border bg-surface/80 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur ${
                    i === 0 ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                        {addr.label || "Address"}
                      </span>
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2 py-1 text-[11px] font-bold text-success">
                          <Star className="h-3 w-3 fill-current" /> Default
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => handleRemoveAddress(i)}
                      className="cursor-pointer rounded-lg p-1.5 text-subtle transition hover:bg-danger/10 hover:text-danger"
                      title="Remove address"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="mt-3 space-y-0.5 text-sm text-muted">
                    {addr.line1 && <p>{addr.line1}</p>}
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>{[addr.city, addr.state].filter(Boolean).join(", ")}</p>
                    {addr.pincode && <p className="font-semibold">{addr.pincode}</p>}
                  </div>
                  <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
                    <button
                      onClick={() => startEditAddress(i)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    {i !== 0 ? (
                      <button
                        onClick={() => handleSetDefault(i)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface-muted hover:text-text"
                      >
                        <Star className="h-3.5 w-3.5" /> Set as default
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Add address form */}
            {showAddForm && (
              <div className="rounded-xl border border-primary/20 bg-surface/90 p-6 shadow-[0_8px_40px_rgba(255,79,134,0.08)] backdrop-blur">
                <h3 className="text-sm font-semibold text-text">{editingIndex != null ? "Edit Address" : "New Address"}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-subtle">Label</label>
                    <Dropdown
                      value={newAddress.label}
                      onChange={(next) => setNewAddress({ ...newAddress, label: next })}
                      options={ADDRESS_LABEL_OPTIONS}
                      placeholder="Select label"
                      ariaLabel="Address label"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-subtle">Pincode *</label>
                    <input type="text" maxLength={6} value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm outline-none focus:border-primary" placeholder="110001" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-subtle">Address Line 1 *</label>
                    <input type="text" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm outline-none focus:border-primary" placeholder="House no, Building, Street" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-subtle">Address Line 2</label>
                    <input type="text" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Area, Landmark" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-subtle">City & State *</label>
                    <div className="mt-1">
                      <CityStateDropdown
                        cityValue={newAddress.city}
                        stateValue={newAddress.state}
                        onChange={(loc) => setNewAddress((a) => ({ ...a, city: loc.city, state: loc.state }))}
                        placeholderCity="Search city…"
                        placeholderState="State"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <button onClick={handleSubmitAddress} disabled={saving}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(255,79,134,0.25)] transition hover:bg-primary-hover disabled:opacity-60">
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <CheckIcon />}
                    {editingIndex != null ? "Update Address" : "Save Address"}
                  </button>
                  <button onClick={() => { setShowAddForm(false); setEditingIndex(null); }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-strong px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted">
                    <XIcon /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Settings Tab ───────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <h2 className="text-base font-semibold text-text">Account settings</h2>
              <p className="mt-1 text-sm text-muted">
                Manage your sign-in details from <Link href="/profile" className="text-primary underline">Profile</Link>.
                If you want to walk through the wedding wizard again, use{" "}
                <span className="font-semibold text-text">Restart my journey</span> from the
                avatar menu in the header.
              </p>
            </div>

            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6">
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-danger">Delete my account</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Closes your account permanently. Past orders and refunds stay on file
                    for ledger integrity (admins still need them), but your profile,
                    addresses and wedding details are erased and you won&apos;t be able to
                    sign in again with this phone number.
                  </p>

                  <div className="mt-4 space-y-2">
                    <label className="block text-xs font-semibold text-text">
                      Type <span className="font-mono">DELETE</span> below to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="h-10 w-full max-w-xs rounded-md border border-border-strong bg-surface px-3 text-sm font-medium text-text outline-none focus:border-danger"
                    />
                    <button
                      type="button"
                      disabled={deletingAccount || deleteConfirmText.trim() !== "DELETE"}
                      onClick={async () => {
                        const token = getAuthToken();
                        if (!token) {
                          router.push("/login");
                          return;
                        }
                        setDeletingAccount(true);
                        try {
                          await deleteMyAccount(token);
                          toast.success("Account deleted.");
                          clearAuthCookies();
                          router.replace("/");
                          router.refresh();
                        } catch (err) {
                          toast.error(err?.message || "Couldn't delete your account.");
                          setDeletingAccount(false);
                        }
                      }}
                      className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-danger px-4 text-sm font-semibold text-primary-foreground transition hover:bg-danger/90 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingAccount ? "Deleting…" : "Delete my account"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
