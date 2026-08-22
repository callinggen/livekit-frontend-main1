"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2, Sparkles, Loader2, Coins, CreditCard, ShieldCheck, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { credits, refreshCredits } = useCredits();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

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
        description: `${orderDetails.plan_name} Pack - ${
          planName === "Starter" ? "2,000" :
          planName === "Growth" ? "5,000" :
          planName === "Pro" ? "10,000" : "25,000"
        } Credits`,
        order_id: orderDetails.razorpay_order_id,
        handler: async function (response: any) {
          setLoadingPlan(planName);
          try {
            // Call backend verification
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Refresh Context Balance
            refreshCredits();
            showToast("success", `Success! Credited ${verifyRes.credits} credits to your account.`);
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
      showToast("success", `Sandbox Checkout Success! Credited ${planName} pack. New Balance: ${verifyRes.credits} credits.`);
    } catch (err: any) {
      console.error("Mock verification failed:", err);
      showToast("error", err.message || "Mock payment simulation failed.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      name: "Starter",
      tagline: "Testing AI Calling for Small Teams",
      price: "₹2,999",
      subPrice: "per month",
      credits: "2,000 Credits",
      minutes: "≈ 133 minutes",
      popular: false,
      buttonText: "Get Starter Pack",
      buttonVariant: "outline" as const,
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
      buttonText: "Start Growth",
      buttonVariant: "default" as const,
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
      tagline: "High-volume business automation",
      price: "₹12,999",
      credits: "10,000 Credits Included",
      popular: true,
      buttonText: "Get Pro Pack",
      buttonVariant: "default" as const,
      features: [
        "10 Active AI Voice Agents",
        "10,000 Calling Credits",
        "Inbound & Outbound Calling",
        "Real-time Campaign Monitoring",
        "Advanced Call Transcripts",
        "Priority Support",
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
      buttonText: "Start Pro",
      buttonVariant: "outline" as const,
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
      buttonText: "Get Business Pack",
      buttonVariant: "outline" as const,
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


  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow pt-32 pb-24 relative overflow-hidden">
        
        {/* Dynamic Background Blurs */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-[#4F6BFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-[#7B61FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px]">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PAY-AS-YOU-GO TOP-UPS</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
              Credit Top-Up Packs for{" "}
              <span className="bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] bg-clip-text text-transparent">
                CallingGen
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Purchase credits instantly and top up your account. No hidden subscriptions, no commitments, and credits never expire.
            </p>

            {/* Current Balance Display */}
            {isLoggedIn && credits !== null && (
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/70 dark:bg-[#111827]/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md">
                <Coins className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Current Balance:</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{credits} Credits</span>
              </div>
            )}
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto items-stretch relative">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 relative ${
                  plan.popular
                    ? "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border-[#4F6BFF] shadow-xl shadow-indigo-500/20 scale-[1.03] z-10"
                    : "bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg hover:scale-[1.01]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4F6BFF] text-white px-4 py-1 rounded-full text-[10px] font-bold shadow-md uppercase tracking-wider">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <h3 className={`text-2xl font-bold mb-1.5 ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mb-6 min-h-[32px] ${plan.popular ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                    {plan.tagline}
                  </p>

                  <div className="mb-6 pb-6 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs font-medium ${plan.popular ? "text-slate-300" : "text-slate-400"}`}>
                        One-Time
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                      <span className={`text-xs font-semibold inline-block px-2.5 py-0.5 rounded-full ${
                        plan.popular ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}>
                        {plan.credits}
                      </span>
                      {plan.minutes && (
                        <span className={`text-xs ${plan.popular ? "text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                          {plan.minutes}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-emerald-400" : "text-[#4F6BFF]"}`} />
                        <span className={plan.popular ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handlePayment(plan.name)}
                  disabled={loadingPlan !== null}
                  variant={plan.buttonVariant}
                  className={`w-full rounded-full py-6 text-sm font-bold transition-all relative overflow-hidden group ${
                    plan.popular
                      ? "bg-[#4F6BFF] hover:bg-[#435BE0] text-white shadow-lg shadow-[#4F6BFF]/30 disabled:bg-[#4F6BFF]/60"
                      : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                  }`}
                >
                  {loadingPlan === plan.name ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Initiating...</span>
                    </span>
                  ) : (
                    <span>{plan.buttonText}</span>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Footer Security Badges */}
          <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Secure SSL Encryption
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Processed via Razorpay
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Instant Credits Delivery
            </span>
          </div>

        </div>
      </main>

      <Footer />

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
                showToast("info", "Local sandbox checkout closed.");
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
                <span className="font-medium text-slate-500 dark:text-slate-400">Plan Selected:</span>
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
                  showToast("info", "Local payment simulation cancelled.");
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
}