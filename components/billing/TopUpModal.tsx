"use client";

import { useState } from "react";
import { 
  X, Zap, Check, Sparkles, Loader2, ShieldCheck, 
  Coins, ArrowRight, CheckCircle2, AlertCircle, 
  Sliders, PhoneCall, MessageSquare, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialCredits?: number;
}

export const TOPUP_PACKAGES = [
  { credits: 100, price: 199, effective: "₹1.99", popular: false, badge: "Starter" },
  { credits: 500, price: 899, effective: "₹1.80", popular: false, badge: "Popular" },
  { credits: 1000, price: 1699, effective: "₹1.70", popular: true, badge: "Best Value" },
  { credits: 2500, price: 3999, effective: "₹1.60", popular: false, badge: "Growth" },
  { credits: 5000, price: 7499, effective: "₹1.50", popular: false, badge: "Pro" },
  { credits: 10000, price: 13999, effective: "₹1.40", popular: false, badge: "Enterprise" },
];

export function calculateTopUpPrice(credits: number): { price: number; effectiveRate: string } {
  const match = TOPUP_PACKAGES.find((p) => p.credits === credits);
  if (match) {
    return { price: match.price, effectiveRate: match.effective };
  }
  let price = 0;
  if (credits <= 100) {
    price = 199;
  } else if (credits <= 500) {
    price = Math.round(credits * 1.80);
  } else if (credits <= 1000) {
    price = Math.round(credits * 1.70);
  } else if (credits <= 2500) {
    price = Math.round(credits * 1.60);
  } else if (credits <= 5000) {
    price = Math.round(credits * 1.50);
  } else {
    price = Math.round(credits * 1.40);
  }
  const effectiveRate = `₹${(price / credits).toFixed(2)}`;
  return { price, effectiveRate };
}

export default function TopUpModal({ isOpen, onClose, onSuccess, initialCredits = 1000 }: TopUpModalProps) {
  const { user, refreshUser } = useAuth();
  const { refreshCredits } = useCredits();

  const [selectedCredits, setSelectedCredits] = useState<number>(initialCredits);
  const [isCustomSlider, setIsCustomSlider] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mockOrder, setMockOrder] = useState<any | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  if (!isOpen) return null;

  const { price, effectiveRate } = calculateTopUpPrice(selectedCredits);

  // Equivalents
  const callMins = Math.floor(selectedCredits / 15);
  const callSecs = Math.floor((selectedCredits % 15) * 4);
  const waMsgs = Math.floor(selectedCredits / 0.1);
  const emailCount = Math.floor(selectedCredits / 0.2);

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

  const handleBuy = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch("/api/billing/topup/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credits: selectedCredits }),
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
        description: `Top-Up ${selectedCredits.toLocaleString()} CallingGen Credits`,
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
                credits: selectedCredits,
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
              message: `Successfully added ${selectedCredits.toLocaleString()} credits to your Universal Wallet!`,
            });
            setTimeout(() => {
              onClose();
            }, 1500);
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
          color: "#6366F1",
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
          credits: selectedCredits,
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
        message: `Sandbox Success! Added ${selectedCredits.toLocaleString()} credits to your Universal Wallet.`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Sandbox payment failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0E131F] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
              Top-Up Credits
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Add universal credits anytime. Credits never expire and roll over seamlessly.
            </p>
          </div>
        </div>

        {/* Mode Selector (Packages vs Custom Slider) */}
        <div className="flex items-center justify-between my-4 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
          <button
            onClick={() => setIsCustomSlider(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isCustomSlider
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Pre-set Packages
          </button>
          <button
            onClick={() => setIsCustomSlider(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isCustomSlider
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Custom Slider
          </button>
        </div>

        {/* Pre-set Packages Grid */}
        {!isCustomSlider ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
            {TOPUP_PACKAGES.map((pkg) => {
              const isSelected = selectedCredits === pkg.credits;
              return (
                <div
                  key={pkg.credits}
                  onClick={() => setSelectedCredits(pkg.credits)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25 scale-[1.02]"
                      : "bg-zinc-50 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  {pkg.popular && !isSelected && (
                    <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                      {pkg.badge}
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                        {pkg.credits.toLocaleString()} Credits
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-xl font-extrabold tracking-tight">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-[11px] opacity-80 font-mono">
                    <span>Rate</span>
                    <span>{pkg.effective}/cr</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Interactive Credit Slider with Gradient Track */
          <div className="my-4 p-5 rounded-2xl bg-[#0C101B] border border-zinc-800 text-white space-y-4 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Selected Credits
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {selectedCredits.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-zinc-400">Credits</span>
              </div>
            </div>

            {/* Custom Multi-Gradient Track & Input */}
            <div className="relative py-4 flex items-center">
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#A855F7] via-[#6366F1] to-[#2DD4BF] transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, ((selectedCredits - 100) / (25000 - 100)) * 100))}%` }}
                />
              </div>

              <input
                type="range"
                min={100}
                max={25000}
                step={selectedCredits < 1000 ? 100 : selectedCredits < 5000 ? 250 : 500}
                value={selectedCredits}
                onChange={(e) => setSelectedCredits(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-4 border-[#8B5CF6] shadow-md shadow-purple-500/50 pointer-events-none transition-all duration-150 z-10"
                style={{ left: `${Math.min(100, Math.max(0, ((selectedCredits - 100) / (25000 - 100)) * 100))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>100 cr</span>
              <span>5,000 cr</span>
              <span>10,000 cr</span>
              <span>25,000 cr</span>
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/80">
              {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedCredits(amt)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    selectedCredits === amt
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 hover:border-indigo-400"
                  }`}
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Channel Equivalent Breakdown */}
        <div className="my-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
            <div className="flex items-center justify-center gap-1 text-violet-600 dark:text-violet-400 text-[11px] font-bold mb-0.5">
              <PhoneCall className="w-3.5 h-3.5" /> AI Calling
            </div>
            <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              ~{callMins}m {callSecs > 0 ? `${callSecs}s` : ""}
            </div>
            <div className="text-[10px] text-zinc-400">@ 15 cr/min</div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-0.5">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </div>
            <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              {waMsgs.toLocaleString()} msgs
            </div>
            <div className="text-[10px] text-zinc-400">@ 0.1 cr/msg</div>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30">
            <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400 text-[11px] font-bold mb-0.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </div>
            <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              {emailCount.toLocaleString()} emails
            </div>
            <div className="text-[10px] text-zinc-400">@ 0.2 cr/email</div>
          </div>
        </div>

        {/* Selected Summary & Pay Button */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Purchase:</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                ₹{price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                ({effectiveRate}/credit)
              </span>
            </div>
          </div>

          <Button
            onClick={handleBuy}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Top Up Now</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-4 flex items-center justify-center gap-6 text-[11px] text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure 256-Bit SSL Checkout
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Instant Wallet Delivery
          </span>
        </div>

        {/* Mock Sandbox Modal */}
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
                  Simulate Successful Payment
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

        {/* Toast */}
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
    </div>
  );
}

