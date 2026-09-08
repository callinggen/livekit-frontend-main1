"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { 
  CheckCircle2, Sparkles, Loader2, Coins, CreditCard, 
  ShieldCheck, AlertCircle, X, Zap, Crown, ArrowRight, 
  TrendingUp, Check, Plus, Minus, ArrowDown, Flame, Receipt
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";

export default function PricingPage() {
  const router = useRouter();
  const { isLoggedIn, user, refreshUser } = useAuth();
  const { credits, refreshCredits } = useCredits();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Add-On Credits Slider State (Rate: ₹1.5 per credit, min: 100)
  const [addonCredits, setAddonCredits] = useState<number>(500);

  // Pricing calculation: 1 credit = 1.5 INR
  const addonPrice = useMemo(() => {
    return Math.round(addonCredits * 1.5);
  }, [addonCredits]);

  // Milestone points for slider
  const milestones = [
    { credits: 100, price: 150 },
    { credits: 500, price: 750 },
    { credits: 1000, price: 1500 },
    { credits: 2500, price: 3750 },
    { credits: 5000, price: 7500 },
    { credits: 10000, price: 15000 },
    { credits: 20000, price: 30000 },
  ];

  // Dynamic recommendation tagline based on slider
  const getAddonTagline = (qty: number) => {
    if (qty <= 500) return "Best for: Trial campaigns & small follow-ups";
    if (qty <= 2000) return "Best for: Weekly outreach & active campaigns";
    if (qty <= 5000) return "Best for: High-volume sales & calling sprints";
    return "Best for: Large-scale operations & bulk calling";
  };

  // Auto-clear toast alert
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  };

  const scrollToTopUp = () => {
    const el = document.getElementById("topup-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (planName: string, customCredits?: number) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    const targetKey = customCredits ? `Addon-${customCredits}` : planName;
    setLoadingPlan(targetKey);

    try {
      // 1. Create order on Backend (supports custom credits)
      const orderDetails = await api.createPaymentOrder(planName, customCredits);

      // 2. Check if order is generated in Developer Sandbox Mock mode
      if (orderDetails.razorpay_order_id.startsWith("order_mock_")) {
        setMockOrder(orderDetails);
        return;
      }

      // 3. Load standard Razorpay widget
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showToast("error", "Unable to load Razorpay integration script. Please check your network.");
        setLoadingPlan(null);
        return;
      }

      // 4. Configure Razorpay Widget
      const options = {
        key: orderDetails.key_id,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        name: "CallingGen",
        description: customCredits 
          ? `Add-On Pack - ${customCredits.toLocaleString()} Credits` 
          : `${orderDetails.plan_name} Plan`,
        order_id: orderDetails.razorpay_order_id,
        handler: async function (response: any) {
          setLoadingPlan(targetKey);
          try {
            // Call backend verification
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Refresh Context Balance and User Data
            refreshCredits();
            await refreshUser();
            showToast("success", `Payment successful! Added ${verifyRes.credits} credits to your account.`);
          } catch (err: any) {
            console.error("Verification failed:", err);
            showToast("error", err.message || "Payment verification failed. Please contact support.");
          } finally {
            setLoadingPlan(null);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone_number || "",
        },
        theme: {
          color: "#4F6BFF",
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
            showToast("info", "Checkout closed.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Payment initiation failed:", err);
      showToast("error", err.message || "Failed to initiate payment transaction.");
      setLoadingPlan(null);
    }
  };

  const handleMockSuccess = async () => {
    if (!mockOrder) return;
    const planName = mockOrder.plan_name;
    const orderId = mockOrder.razorpay_order_id;
    
    setMockOrder(null);
    setLoadingPlan(planName);
    try {
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 14)}`;
      const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 14)}`;

      // Simulate payment verification call
      const verifyRes = await api.verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      refreshCredits();
      await refreshUser();
      showToast("success", `Sandbox Checkout Success! Credited ${planName}. New Balance: ${verifyRes.credits} credits.`);
    } catch (err: any) {
      console.error("Mock verification failed:", err);
      showToast("error", err.message || "Mock payment simulation failed.");
    } finally {
      setLoadingPlan(null);
    }
  };

  // Base subscription plans
  const plans = [
    {
      name: "Starter",
      tagline: "Testing AI Calling for Small Teams",
      price: "₹2,999",
      subPrice: "per month",
      credits: "2,000 Credits",
      minutes: "≈ 133 minutes",
      popular: false,
      features: [
        "2,000 Calling Credits / Month",
        "1 Active AI Voice Agent",
        "Inbound & Outbound Calling",
        "English, Hindi & Telugu Support",
        "Basic Call Transcripts & Reports",
        "Email Support",
      ],
    },
    {
      name: "Growth",
      tagline: "Scaling AI Calling for Growing Sales Teams",
      price: "₹6,999",
      subPrice: "per month",
      credits: "5,000 Credits",
      minutes: "≈ 333 minutes",
      popular: true,
      features: [
        "3 Active AI Voice Agents",
        "5,000 Calling Credits",
        "Inbound & Outbound Calling",
        "Multi-language Support",
        "Standard Support",
      ],
    },
    {
      name: "Pro",
      tagline: "High-Volume Campaigns for Power Users",
      price: "₹12,999",
      subPrice: "per month",
      credits: "10,000 Credits",
      minutes: "≈ 667 minutes",
      popular: false,
      features: [
        "10,000 Calling Credits / Month",
        "10 Active AI Voice Agents",
        "Multiple Outbound Numbers",
        "Custom AI Script & Persona Builder",
        "Live Campaign Performance Dashboard",
        "CRM Integration & Webhooks",
        "Dedicated Account Manager",
      ],
    },
    {
      name: "Business",
      tagline: "Multiple Campaigns & Teams at Scale",
      price: "₹29,999",
      subPrice: "per month",
      credits: "25,000 Credits",
      minutes: "≈ 1,667 minutes",
      popular: false,
      features: [
        "25,000 Calling Credits / Month",
        "Unlimited AI Voice Agents",
        "25,000 Calling Credits",
        "Custom Concurrency & SIP Trunks",
        "Dedicated Server Infrastructure",
        "White-Label UI Capabilities",
        "Custom API & Webhooks",
        "99.9% Uptime SLA",
        "24/7 Phone Support",
      ],
    },
  ];

  // User's current plan
  const currentPlanName = user?.subscription_plan || "Starter";

  const pageContent = (
    <div className="space-y-16 pb-16">
      
      {/* ── Top Header Section ── */}
      <div className="text-center max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs sm:text-sm font-semibold tracking-wide mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>FLEXIBLE PLANS & ADD-ON TOP-UPS</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
          Plans & Credits for{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            CallingGen
          </span>
        </h1>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-6">
          Upgrade your monthly subscription tier or purchase flexible add-on credits anytime. Credits never expire.
        </p>

        {/* Current Status Pills & History Link */}
        {isLoggedIn && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold shadow-sm">
              <Crown className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Current Plan: <strong className="uppercase">{currentPlanName}</strong></span>
            </div>
            {credits !== null && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold shadow-sm">
                <Coins className="w-4 h-4 text-indigo-500" />
                <span>Available Balance: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{credits} Credits</strong></span>
              </div>
            )}
            <Link
              href="/pricing/history"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 text-xs font-semibold shadow-sm transition hover:scale-105"
            >
              <Receipt className="w-4 h-4 text-indigo-500" />
              <span>Payment History</span>
            </Link>
          </div>
        )}

        {/* ── Hook Line Banner for Quick Top-Up ── */}
        <div className="mt-8 max-w-3xl mx-auto p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/40 dark:bg-indigo-950/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Zap className="w-5 h-5 fill-white text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  On-Demand Top Up
                </span>
                <span className="inline-block h-1 w-1 rounded-full bg-zinc-400"></span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Zero Expiry • 100% Rollover
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-0.5">
                Need extra credits without upgrading your plan?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Top up on-demand starting at just <strong className="text-indigo-600 dark:text-indigo-400">₹150 for 100 credits</strong> (₹1.50/credit).
              </p>
            </div>
          </div>

          <button
            onClick={scrollToTopUp}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Top Up Credits</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </div>

      {/* ── 1. Subscription Plans Section ── */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Subscription Plans</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Choose the monthly tier that suits your business scale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, idx) => {
            const isCurrentPlan = isLoggedIn && currentPlanName.toLowerCase() === plan.name.toLowerCase();
            const isUpgrade = !isCurrentPlan;

            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 md:p-7 border flex flex-col justify-between transition-all duration-300 relative ${
                  isCurrentPlan
                    ? "bg-white dark:bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                    : plan.popular
                    ? "bg-gradient-to-b from-zinc-900 via-indigo-950 to-zinc-900 text-white border-violet-500 shadow-xl shadow-violet-500/20 scale-[1.02] z-10"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider flex items-center gap-1 z-20">
                    <CheckCircle2 className="w-3 h-3" /> Current Plan
                  </div>
                )}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-600 text-white px-3.5 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className={`text-xl font-bold mb-1 ${plan.popular && !isCurrentPlan ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mb-5 min-h-[30px] ${plan.popular && !isCurrentPlan ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {plan.tagline}
                  </p>

                  <div className="mb-5 pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold ${plan.popular && !isCurrentPlan ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs font-medium ${plan.popular && !isCurrentPlan ? "text-zinc-300" : "text-zinc-400"}`}>
                        / month
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className={`text-xs font-semibold inline-block px-2.5 py-0.5 rounded-full ${
                        plan.popular && !isCurrentPlan ? "bg-violet-500/20 text-violet-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}>
                        {plan.credits}
                      </span>
                      {plan.minutes && (
                        <span className={`text-[11px] ${plan.popular && !isCurrentPlan ? "text-zinc-400" : "text-zinc-400"}`}>
                          {plan.minutes}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs font-medium">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.popular && !isCurrentPlan ? "text-emerald-400" : "text-violet-600 dark:text-violet-400"}`} />
                        <span className={plan.popular && !isCurrentPlan ? "text-zinc-200" : "text-zinc-600 dark:text-zinc-300"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => isUpgrade && handlePayment(plan.name)}
                  disabled={loadingPlan !== null || isCurrentPlan}
                  variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
                  className={`w-full rounded-xl py-5 text-xs font-bold transition-all relative overflow-hidden ${
                    isCurrentPlan
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 cursor-default opacity-100"
                      : plan.popular
                      ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/30"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initiating...</span>
                    </span>
                  ) : isCurrentPlan ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Current Plan</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <span>Upgrade to {plan.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Add-On Credits Section (Clean Platform Style) ── */}
      <div id="topup-section" className="space-y-6 pt-6 scroll-mt-10">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Add-On Credits
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Need more credits? Top up your plan with flexible on-demand credits at ₹1.50 per credit.
          </p>
        </div>

        {/* Clean Platform Card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
          
          {/* Header Row */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>{getAddonTagline(addonCredits)}</span>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Fixed Rate: <span className="text-zinc-900 dark:text-white font-bold">₹1.50 / credit</span>
            </div>
          </div>

          {/* Quick Preset Packs Grid */}
          <div className="mb-6">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2.5">
              Quick Select Pack:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                { qty: 100, price: 150, label: "100 Credits" },
                { qty: 500, price: 750, label: "500 Credits" },
                { qty: 1000, price: 1500, label: "1,000 Credits" },
                { qty: 2500, price: 3750, label: "2,500 Credits" },
                { qty: 5000, price: 7500, label: "5,000 Credits" },
                { qty: 10000, price: 15000, label: "10,000 Credits" },
              ].map((p) => {
                const isSelected = addonCredits === p.qty;
                return (
                  <button
                    key={p.qty}
                    type="button"
                    onClick={() => setAddonCredits(p.qty)}
                    className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all border text-center cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                    <span className={`text-[11px] font-mono mt-0.5 ${isSelected ? "text-indigo-100" : "text-zinc-500"}`}>
                      ₹{p.price.toLocaleString("en-IN")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Credits & Price Display with Animated Top-Up Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 my-6 p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {addonCredits.toLocaleString()} credits
              </h3>
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                ₹{addonPrice.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Animated Button with Shimmer and Pulse */}
            <button
              onClick={() => handlePayment("Add-On Credits", addonCredits)}
              disabled={loadingPlan !== null}
              className="relative group overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 text-sm font-bold shadow-md shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {/* Shimmer Light Beam Animation */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></span>
              
              {loadingPlan === `Addon-${addonCredits}` ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Zap className="h-4 w-4 fill-white text-white group-hover:scale-110 transition-transform duration-200" />
              )}
              <span>Top Up ₹{addonPrice.toLocaleString("en-IN")}</span>
            </button>
          </div>

          {/* Slider */}
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center">
              <input
                type="range"
                min={100}
                max={20000}
                step={100}
                value={addonCredits}
                onChange={(e) => setAddonCredits(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-200 dark:bg-zinc-700 accent-indigo-600 focus:outline-none"
              />
            </div>

            {/* Milestone Markers */}
            <div className="flex justify-between items-center text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 px-1 font-mono">
              {milestones.map((m) => (
                <button
                  key={m.credits}
                  type="button"
                  onClick={() => setAddonCredits(m.credits)}
                  className={`transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    addonCredits === m.credits ? "text-indigo-600 dark:text-indigo-400 font-bold" : ""
                  }`}
                >
                  ₹{m.price.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>

          {/* Quick adjust stepper & custom quantity input */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Quick adjust:</span>
              <button
                type="button"
                onClick={() => setAddonCredits((prev) => Math.max(100, prev - 500))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                -500
              </button>
              <button
                type="button"
                onClick={() => setAddonCredits((prev) => Math.max(100, prev - 100))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                -100
              </button>
              <button
                type="button"
                onClick={() => setAddonCredits((prev) => Math.min(50000, prev + 100))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                +100
              </button>
              <button
                type="button"
                onClick={() => setAddonCredits((prev) => Math.min(50000, prev + 500))}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                +500
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Custom credits:</span>
              <input
                type="number"
                min={100}
                max={100000}
                step={50}
                value={addonCredits}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 1) setAddonCredits(val);
                }}
                className="w-24 rounded-lg bg-white dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 font-mono text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Security & Guarantee Badges ── */}
      <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium pt-4">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-Bit SSL Encrypted
        </span>
        <span className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-500" /> Powered by Razorpay
        </span>
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Instant Credits Delivery
        </span>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. MOCK DEVELOPER SANDBOX MODAL */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {mockOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setMockOrder(null);
                setLoadingPlan(null);
                showToast("info", "Sandbox checkout closed.");
              }}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Developer Sandbox Checkout</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 dark:bg-amber-500/20 rounded-md py-1 px-2.5 mt-2 inline-block">
                Local Testing Active
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-slate-500 dark:text-slate-400">Order ID:</span>
                <span className="font-mono text-xs">{mockOrder.razorpay_order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500 dark:text-slate-400">Item Selected:</span>
                <span className="font-semibold">{mockOrder.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-500 dark:text-slate-400">Amount:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  ₹{(mockOrder.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleMockSuccess}
                className="w-full rounded-full py-5 font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
              >
                Simulate Successful Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMockOrder(null);
                  setLoadingPlan(null);
                  showToast("info", "Payment simulation cancelled.");
                }}
                className="w-full rounded-full py-5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. FLOATING PREMIUM TOAST ALERTS */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
          <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-start gap-3.5 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5"
              : toast.type === "error"
              ? "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400 shadow-rose-500/5"
              : "bg-slate-500/10 border-slate-500/25 text-slate-600 dark:text-slate-400 shadow-slate-500/5"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5.5 h-5.5 shrink-0 text-emerald-500" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-5.5 h-5.5 shrink-0 text-rose-500" />
            ) : (
              <Sparkles className="w-5.5 h-5.5 shrink-0 text-slate-500" />
            )}
            <div className="flex-grow">
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-85 mb-0.5">
                {toast.type === "success" ? "Success" : toast.type === "error" ? "Failure" : "Notice"}
              </h4>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-0.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <X className="w-4 h-4 opacity-70" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isLoggedIn) {
    return (
      <DashboardShell title="Buy Credits & Plans">
        {pageContent}
      </DashboardShell>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300">
      <Navbar />
      <main className="flex-grow pt-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
          {pageContent}
        </div>
      </main>
      <Footer />
    </div>
  );
}