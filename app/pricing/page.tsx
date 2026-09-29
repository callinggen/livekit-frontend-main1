"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { 
  CheckCircle2, Sparkles, Loader2, Coins, CreditCard, 
  ShieldCheck, AlertCircle, X, Zap, Crown, ArrowRight, 
  Check, PhoneCall, MessageSquare, Mail, Receipt, Layers 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import TopUpModal, { TOPUP_PACKAGES } from "@/components/billing/TopUpModal";
import AddOnCreditsSlider from "@/components/billing/AddOnCreditsSlider";

export default function PricingPage() {
  const router = useRouter();
  const { isLoggedIn, user, refreshUser } = useAuth();
  const { credits, refreshCredits } = useCredits();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [topUpInitialCredits, setTopUpInitialCredits] = useState<number>(1000);

  const openTopUpWithCredits = (credits: number) => {
    setTopUpInitialCredits(credits);
    setIsTopUpOpen(true);
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

  const handlePayment = async (planName: string) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setLoadingPlan(planName);

    try {
      // 1. Create order on Backend
      const orderDetails = await api.createPaymentOrder(planName);

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
        description: `${orderDetails.plan_name} Plan Subscription`,
        order_id: orderDetails.razorpay_order_id,
        handler: async function (response: any) {
          setLoadingPlan(planName);
          try {
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            refreshCredits();
            await refreshUser();
            showToast(
              "success", 
              `Payment successful! Upgraded to ${orderDetails.plan_name} plan.`
            );
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

      const verifyRes = await api.verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      refreshCredits();
      await refreshUser();
      showToast("success", `Sandbox Checkout Success! Upgraded to ${planName}.`);
    } catch (err: any) {
      console.error("Mock verification failed:", err);
      showToast("error", err.message || "Mock payment simulation failed.");
    } finally {
      setLoadingPlan(null);
    }
  };

  // Section 2 & 12 Specification Plans
  const plans = [
    {
      name: "Starter",
      tagline: "AI Calling + WhatsApp + Email Automation",
      price: "₹2,999",
      credits: "2,000 CallingGen Credits",
      effective: "₹1.50 / credit",
      popular: false,
      maxEquivalent: {
        calling: "~133 mins calling",
        whatsapp: "20,000 messages",
        email: "10,000 emails",
      },
      features: [
        "2,000 CallingGen Credits",
        "AI Calling (15 cr/min)",
        "WhatsApp Automation (1 cr/10 msgs)",
        "Email Automation (1 cr/5 emails)",
        "1 AI Voice Agent",
        "Basic Automation Triggers",
        "Standard Analytics & Reporting",
      ],
    },
    {
      name: "Growth",
      tagline: "High-Performance Multi-Channel Outreach",
      price: "₹6,999",
      credits: "5,000 CallingGen Credits",
      effective: "₹1.40 / credit",
      popular: true,
      maxEquivalent: {
        calling: "~333 mins calling",
        whatsapp: "50,000 messages",
        email: "25,000 emails",
      },
      features: [
        "5,000 CallingGen Credits",
        "AI Calling (15 cr/min)",
        "WhatsApp Automation (1 cr/10 msgs)",
        "Email Automation (1 cr/5 emails)",
        "3 AI Voice Agents",
        "Standard Automation Workflows",
        "Multi-language Voice Models",
        "Priority Support",
      ],
    },
    {
      name: "Pro",
      tagline: "Omnichannel Powerhouse with Integrations",
      price: "₹12,999",
      credits: "10,000 CallingGen Credits",
      effective: "₹1.30 / credit",
      popular: false,
      maxEquivalent: {
        calling: "~667 mins calling",
        whatsapp: "100,000 messages",
        email: "50,000 emails",
      },
      features: [
        "10,000 CallingGen Credits",
        "AI Calling (15 cr/min)",
        "WhatsApp Automation (1 cr/10 msgs)",
        "Email Automation (1 cr/5 emails)",
        "10 AI Voice Agents",
        "Advanced Automation & Workflows",
        "CRM Integrations (HubSpot, LeadSquared)",
        "API & Webhook Access",
      ],
    },
    {
      name: "Business",
      tagline: "Enterprise Scale with Dedicated Infrastructure",
      price: "₹29,999",
      credits: "25,000 CallingGen Credits",
      effective: "₹1.20 / credit",
      popular: false,
      maxEquivalent: {
        calling: "~1,667 mins calling",
        whatsapp: "250,000 messages",
        email: "125,000 emails",
      },
      features: [
        "25,000 CallingGen Credits",
        "AI Calling (15 cr/min)",
        "WhatsApp Automation (1 cr/10 msgs)",
        "Email Automation (1 cr/5 emails)",
        "Unlimited AI Voice Agents",
        "Advanced Automation",
        "Custom Integrations & Concurrency",
        "SIP Trunk Integration",
        "Dedicated Infrastructure & SLA",
      ],
    },
  ];

  const currentPlanName = user?.subscription_plan || "Starter";

  const pageContent = (
    <div className="space-y-16 pb-16">
      
      {/* ── Header ── */}
      <div className="text-center max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold tracking-wide mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI CALLING + WHATSAPP + EMAIL AUTOMATION</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
          One Universal Credit Wallet for{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            All Channels
          </span>
        </h1>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
          No fragmented balances. CallingGen provides a unified credit balance powering AI voice calls, WhatsApp messages, and email campaigns seamlessly.
        </p>

        {/* Current Status Pills (Logged In Only) */}
        {isLoggedIn && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold shadow-sm">
              <Crown className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Current Plan: <strong className="uppercase">{currentPlanName}</strong></span>
            </div>
            {credits !== null && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold shadow-sm">
                <Coins className="w-4 h-4 text-indigo-500" />
                <span>Wallet Balance: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{credits} Credits</strong></span>
              </div>
            )}
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-indigo-500 text-xs font-semibold shadow-sm transition"
            >
              <Receipt className="w-4 h-4 text-indigo-500" />
              <span>Billing & Transactions</span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Rates Banner ── */}
      <div className="max-w-4xl mx-auto p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-zinc-900 dark:text-white">AI Calling</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">1 credit = 4s (15 credits/min)</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-zinc-900 dark:text-white">WhatsApp</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">1 credit = 10 messages</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-zinc-900 dark:text-white">Email</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">1 credit = 5 emails</div>
          </div>
        </div>
      </div>

      {/* ── Subscription Plans Grid (Section 2, 3, 12) ── */}
      <div className="space-y-6">
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
                    ? "bg-gradient-to-b from-zinc-900 via-indigo-950 to-zinc-900 text-white border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02] z-10"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider flex items-center gap-1 z-20">
                    <CheckCircle2 className="w-3 h-3" /> Current Plan
                  </div>
                )}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3.5 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className={`text-xl font-bold mb-1 ${plan.popular && !isCurrentPlan ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mb-4 min-h-[24px] ${plan.popular && !isCurrentPlan ? "text-zinc-300" : "text-zinc-500 dark:text-zinc-400"}`}>
                    {plan.tagline}
                  </p>

                  <div className="mb-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold ${plan.popular && !isCurrentPlan ? "text-white" : "text-zinc-900 dark:text-white"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs font-medium ${plan.popular && !isCurrentPlan ? "text-zinc-300" : "text-zinc-400"}`}>
                        / month
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {plan.credits}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ({plan.effective})
                      </span>
                    </div>
                  </div>

                  {/* Section 3: Maximum Equivalent Usage Display */}
                  <div className="mb-5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60 text-[11px] space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                      Max Equivalent Usage:
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                      📞 {plan.maxEquivalent.calling} <span className="text-zinc-400">OR</span>
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                      💬 {plan.maxEquivalent.whatsapp} <span className="text-zinc-400">OR</span>
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                      ✉️ {plan.maxEquivalent.email}
                    </div>
                    <div className="text-[9px] text-zinc-400 pt-1 italic">
                      Or any flexible combination across all 3 channels.
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-xs font-medium">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.popular && !isCurrentPlan ? "text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`} />
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
                  className={`w-full rounded-xl py-5 text-xs font-bold transition-all ${
                    isCurrentPlan
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 cursor-default opacity-100"
                      : plan.popular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 cursor-pointer"
                      : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
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

      {/* ── Section 9: Add-On Credits Slider (Aligned with Design Reference) ── */}
      <AddOnCreditsSlider
        onSuccess={() => {
          refreshCredits();
          refreshUser();
        }}
      />

      {/* Security Footer */}
      <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium pt-4">
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-Bit SSL Encrypted
        </span>
        <span className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-500" /> Powered by Razorpay
        </span>
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Instant Universal Delivery
        </span>
      </div>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        initialCredits={topUpInitialCredits}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={() => {
          refreshCredits();
          refreshUser();
        }}
      />

      {/* Developer Mock Modal */}
      {mockOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
              Developer Sandbox Checkout
            </h3>
            <p className="text-xs text-zinc-500 mb-4 font-mono">
              Plan: {mockOrder.plan_name} • Amount: ₹{(mockOrder.amount / 100).toLocaleString("en-IN")}
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleMockSuccess}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5"
              >
                Simulate Successful Subscription
              </Button>
              <Button
                variant="outline"
                onClick={() => setMockOrder(null)}
                className="w-full rounded-xl border-zinc-300 dark:border-zinc-700 py-5"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5">
          <div className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-start gap-3 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            )}
            <div className="flex-1 text-xs font-semibold">{toast.message}</div>
            <button onClick={() => setToast(null)}><X className="w-4 h-4 opacity-70" /></button>
          </div>
        </div>
      )}

    </div>
  );

  if (isLoggedIn) {
    return (
      <DashboardShell title="Subscription Plans & Credits">
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