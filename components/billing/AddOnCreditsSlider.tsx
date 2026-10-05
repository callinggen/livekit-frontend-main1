"use client";

import { useState } from "react";
import { Zap, Loader2, PhoneCall, MessageSquare, Mail, Sparkles, CheckCircle2, AlertCircle, X, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";

export interface AddOnTier {
  id: number;
  credits: number;
  price: number;
  rate: string;
  badge: string;
  callsApprox: number;
  waMsgs: number;
  emails: number;
}

export const REAL_ADD_ON_TIERS: AddOnTier[] = [
  {
    id: 0,
    credits: 100,
    price: 199,
    rate: "₹1.99/cr",
    badge: "Best for: Quick test & small trial",
    callsApprox: 25,
    waMsgs: 1000,
    emails: 500,
  },
  {
    id: 1,
    credits: 500,
    price: 899,
    rate: "₹1.80/cr",
    badge: "Best for: Trial campaigns & small follow-ups",
    callsApprox: 125,
    waMsgs: 5000,
    emails: 2500,
  },
  {
    id: 2,
    credits: 1000,
    price: 1699,
    rate: "₹1.70/cr",
    badge: "Best for: Growing outbound outreach & daily follow-ups",
    callsApprox: 250,
    waMsgs: 10000,
    emails: 5000,
  },
  {
    id: 3,
    credits: 2500,
    price: 3999,
    rate: "₹1.60/cr",
    badge: "Best for: Multi-channel sales & active campaigns",
    callsApprox: 625,
    waMsgs: 25000,
    emails: 12500,
  },
  {
    id: 4,
    credits: 5000,
    price: 7499,
    rate: "₹1.50/cr",
    badge: "Best for: High-volume outreach & customer engagement",
    callsApprox: 1250,
    waMsgs: 50000,
    emails: 25000,
  },
  {
    id: 5,
    credits: 10000,
    price: 13999,
    rate: "₹1.40/cr",
    badge: "Best for: Enterprise scale operations & heavy volume",
    callsApprox: 2500,
    waMsgs: 100000,
    emails: 50000,
  },
];

interface AddOnCreditsSliderProps {
  onSuccess?: () => void;
  className?: string;
}

export default function AddOnCreditsSlider({ onSuccess, className = "" }: AddOnCreditsSliderProps) {
  const { user, refreshUser } = useAuth();
  const { refreshCredits } = useCredits();

  const [tierIndex, setTierIndex] = useState<number>(2); // Default to 1,000 credits (₹1,699)
  const [loading, setLoading] = useState<boolean>(false);
  const [mockOrder, setMockOrder] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const currentTier = REAL_ADD_ON_TIERS[tierIndex];

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

  const handleTopUp = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch("/api/billing/topup/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits: currentTier.credits }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create topup order");
      }

      const orderData = await res.json();

      // Check if sandbox mock mode
      if (orderData.order_id.startsWith("order_mock_")) {
        setMockOrder(orderData);
        setLoading(false);
        return;
      }

      // Load Razorpay
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setToast({ type: "error", message: "Failed to load payment gateway script" });
        setLoading(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_inr * 100,
        currency: "INR",
        name: "CallingGen",
        description: `Top-Up ${currentTier.credits.toLocaleString()} Credits`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          setLoading(true);
          try {
            const verifyRes = await fetch("/api/billing/topup/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                credits: currentTier.credits,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const vErr = await verifyRes.json().catch(() => ({}));
              throw new Error(vErr.detail || "Payment verification failed");
            }

            refreshCredits();
            await refreshUser();
            if (onSuccess) onSuccess();
            setToast({
              type: "success",
              message: `Payment successful! Added ${currentTier.credits.toLocaleString()} credits to your wallet.`,
            });
          } catch (e: any) {
            setToast({ type: "error", message: e.message || "Payment verification failed" });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone_number || "",
        },
        theme: {
          color: "#7C3AED",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to initiate top-up." });
      setLoading(false);
    }
  };

  const handleMockSuccess = async () => {
    if (!mockOrder) return;
    setLoading(true);
    setMockOrder(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 14)}`;
      const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 14)}`;

      const res = await fetch("/api/billing/topup/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          credits: currentTier.credits,
          razorpay_order_id: mockOrder.order_id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        }),
      });

      if (!res.ok) {
        throw new Error("Sandbox top-up verification failed");
      }

      refreshCredits();
      await refreshUser();
      if (onSuccess) onSuccess();
      setToast({
        type: "success",
        message: `Sandbox Success! Added ${currentTier.credits.toLocaleString()} credits to your wallet.`,
      });
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Sandbox payment failed" });
    } finally {
      setLoading(false);
    }
  };

  // Slider progress percentage
  const progressPercent = (tierIndex / (REAL_ADD_ON_TIERS.length - 1)) * 100;

  return (
    <div className={`w-full max-w-5xl mx-auto ${className}`}>
      
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
          Add-On Credits
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Need more calls, WhatsApp or emails? Top up your plan with add-on credit packs.
        </p>
      </div>

      {/* Main Card (Light + Dark Mode Support) */}
      <div className="relative rounded-3xl p-6 sm:p-10 bg-white dark:bg-[#0C101B] border border-zinc-200 dark:border-zinc-800 shadow-2xl dark:shadow-indigo-950/20 overflow-hidden text-zinc-900 dark:text-white transition-colors duration-300">
        
        {/* Subtle background ambient glow for dark mode */}
        <div className="hidden dark:block absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden dark:block absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-zinc-800/80 border border-indigo-100 dark:border-zinc-700/60 text-indigo-900 dark:text-zinc-300 text-xs font-semibold backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-teal-400 animate-pulse" />
            {currentTier.badge}
          </span>
        </div>

        {/* Value Display & CTA Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                {currentTier.credits.toLocaleString()} Credits
              </h3>
              <span className="text-xl sm:text-2xl font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                ₹{currentTier.price.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
              Effective rate: <strong className="text-indigo-600 dark:text-indigo-400">{currentTier.rate}</strong> • Never expires
            </div>
          </div>

          <Button
            onClick={handleTopUp}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#10B981] hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer border border-white/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-current" />
                <span>Top Up ₹{currentTier.price.toLocaleString("en-IN")}</span>
              </span>
            )}
          </Button>
        </div>

        {/* Slider Section */}
        <div className="space-y-4">
          
          {/* Track and Input */}
          <div className="relative py-4 flex items-center">
            
            {/* Custom Multi-Gradient Track */}
            <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#2DD4BF] transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Native range input for accessible dragging */}
            <input
              type="range"
              min={0}
              max={REAL_ADD_ON_TIERS.length - 1}
              step={1}
              value={tierIndex}
              onChange={(e) => setTierIndex(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Custom Interactive Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border-4 border-[#8B5CF6] shadow-lg shadow-purple-500/50 pointer-events-none transition-all duration-150 z-10"
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* Pricing Stops Labels */}
          <div className="flex justify-between items-center text-xs font-semibold select-none pt-1">
            {REAL_ADD_ON_TIERS.map((tier, idx) => {
              const isSelected = tierIndex === idx;
              return (
                <button
                  key={tier.id}
                  onClick={() => setTierIndex(idx)}
                  className={`transition-all font-mono flex flex-col items-center ${
                    isSelected
                      ? "text-indigo-600 dark:text-white font-bold text-sm scale-110"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <span>₹{tier.price.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] font-normal opacity-75">{tier.credits >= 1000 ? `${tier.credits / 1000}k cr` : `${tier.credits} cr`}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Universal Channel Equivalent Breakdown Footer */}
        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-violet-50/60 dark:bg-zinc-900/60 border border-violet-100 dark:border-zinc-800">
            <PhoneCall className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300">
              <strong>~{Math.round(currentTier.credits / 15)} mins</strong> AI Calling (~{currentTier.callsApprox} calls)
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/60 dark:bg-zinc-900/60 border border-emerald-100 dark:border-zinc-800">
            <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300">
              <strong>{currentTier.waMsgs.toLocaleString()}</strong> WhatsApp Msgs
            </span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50/60 dark:bg-zinc-900/60 border border-sky-100 dark:border-zinc-800">
            <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="text-zinc-700 dark:text-zinc-300">
              <strong>{currentTier.emails.toLocaleString()}</strong> Emails
            </span>
          </div>
        </div>

      </div>

      {/* Developer Sandbox Checkout Modal */}
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
              Order: {mockOrder.order_id} • Amount: ₹{mockOrder.amount_inr}
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleMockSuccess}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5"
              >
                Simulate Successful Top-Up
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

      {/* Toast Notification */}
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
}
