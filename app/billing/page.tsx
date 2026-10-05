"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { 
  Wallet, Zap, PhoneCall, MessageSquare, Mail, 
  ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, 
  ShieldCheck, CreditCard, ChevronRight, Filter, Layers, 
  History, Sparkles, TrendingUp, DollarSign, PlusCircle, CheckCircle2, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TopUpModal from "@/components/billing/TopUpModal";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";

interface WalletData {
  total_balance: number;
  subscription_credit_balance: number;
  topup_credit_balance: number;
  warning_level: "normal" | "warning" | "urgent" | "critical" | "depleted";
  rates: {
    ai_calling_credits_per_minute: number;
    whatsapp_messages_per_credit: number;
    emails_per_credit: number;
  };
  max_equivalent: {
    calling_minutes: number;
    whatsapp_messages: number;
    emails: number;
  };
}

interface UsageSummary {
  calling: {
    duration_seconds: number;
    duration_minutes: number;
    credits_consumed: number;
  };
  whatsapp: {
    messages_sent: number;
    credits_consumed: number;
  };
  email: {
    emails_sent: number;
    credits_consumed: number;
  };
  total_credits_consumed: number;
}

interface TransactionItem {
  id: number;
  transaction_id: string;
  type: string;
  service: string;
  credits: number;
  reference_id: string | null;
  description: string;
  balance_before: number;
  balance_after: number;
  rate_version: string;
  created_at: string;
}

export default function BillingPage() {
  const { user } = useAuth();
  const { refreshCredits } = useCredits();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  
  // Primary view tab: "deductions" | "topups_grants"
  const [activeLedgerTab, setActiveLedgerTab] = useState<"deductions" | "topups_grants">("deductions");
  const [deductionFilter, setDeductionFilter] = useState<string>("all");
  const [grantFilter, setGrantFilter] = useState<string>("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [wRes, uRes, tRes] = await Promise.all([
        fetch("/api/billing/wallet", { headers }),
        fetch("/api/billing/usage-summary", { headers }),
        fetch("/api/billing/transactions?limit=150", { headers }),
      ]);

      if (wRes.ok) {
        const wData = await wRes.json();
        setWallet(wData);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsage(uData.usage);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(tData.transactions || []);
      }
    } catch (e) {
      console.error("Failed to load billing data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTopUpSuccess = () => {
    fetchData();
    refreshCredits();
  };

  // Split deductions (negative credits) and top-ups/grants (positive credits)
  const deductionsList = useMemo(() => {
    return transactions.filter(tx => tx.credits < 0 || tx.type === "usage_deduction");
  }, [transactions]);

  const topupsAndGrantsList = useMemo(() => {
    return transactions.filter(tx => tx.credits > 0 || tx.type !== "usage_deduction");
  }, [transactions]);

  // Filtered deductions
  const filteredDeductions = useMemo(() => {
    if (deductionFilter === "all") return deductionsList;
    if (deductionFilter === "calling") return deductionsList.filter(tx => tx.service === "calling" || tx.type.includes("calling"));
    if (deductionFilter === "whatsapp") return deductionsList.filter(tx => tx.service === "whatsapp" || tx.type.includes("whatsapp"));
    if (deductionFilter === "email") return deductionsList.filter(tx => tx.service === "email" || tx.type.includes("email"));
    return deductionsList;
  }, [deductionsList, deductionFilter]);

  // Filtered top-ups and grants
  const filteredTopupsAndGrants = useMemo(() => {
    if (grantFilter === "all") return topupsAndGrantsList;
    if (grantFilter === "admin") {
      return topupsAndGrantsList.filter(tx => 
        (tx.description && tx.description.toLowerCase().includes("admin")) ||
        (tx.reference_id && tx.reference_id.startsWith("admin")) ||
        tx.type.includes("admin")
      );
    }
    if (grantFilter === "topup") {
      return topupsAndGrantsList.filter(tx => 
        tx.type.includes("topup") && !tx.description?.toLowerCase().includes("admin")
      );
    }
    if (grantFilter === "subscription") {
      return topupsAndGrantsList.filter(tx => tx.type.includes("subscription"));
    }
    return topupsAndGrantsList;
  }, [topupsAndGrantsList, grantFilter]);

  return (
    <DashboardShell title="Universal Billing & Credits">
      <div className="space-y-6 pb-16 max-w-7xl mx-auto">
        
        {/* ── Low-Credit Warning Banner ── */}
        {wallet && wallet.warning_level !== "normal" && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            wallet.warning_level === "depleted"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200"
              : wallet.warning_level === "critical"
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
          }`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce text-amber-500" />
              <div>
                <span className="font-bold text-sm">
                  {wallet.warning_level === "depleted"
                    ? "Credit balance depleted! Billable actions are paused."
                    : `Low-balance warning: Your balance is at ${wallet.total_balance} credits.`}
                </span>
                <p className="text-xs opacity-90 mt-0.5">
                  Top up credits to continue uninterrupted AI calling, WhatsApp campaigns, and email automations.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsTopUpOpen(true)}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0"
            >
              Top Up Credits
            </Button>
          </div>
        )}

        {/* ── Clean Universal Wallet Header Card ── */}
        <div className="rounded-2xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Balance & Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                    Universal Credit Balance
                  </h2>
                </div>
                <button
                  onClick={fetchData}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-mono">
                  {wallet ? wallet.total_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                </span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">Available Credits</span>
              </div>

              {/* Sub-balances: Subscription vs Top-up */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-400 font-medium">Subscription Credits:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">
                    {wallet ? wallet.subscription_credit_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                  </span>
                </div>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="text-zinc-400 font-medium">Top-Up Credits:</span>
                  <span className="font-bold font-mono text-zinc-900 dark:text-white">
                    {wallet ? wallet.topup_credit_balance.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    Never Expires
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Button
                onClick={() => setIsTopUpOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" /> Buy Credits
              </Button>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold w-full"
                >
                  Manage Subscription
                </Button>
              </Link>
            </div>
          </div>

          {/* Clean Rates Sub-bar */}
          <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Billing Rates:</span>
              <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                <PhoneCall className="w-3 h-3 text-violet-500" /> AI Calling: 15 cr / min (1 cr / 4s)
              </span>
              <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp: 0.1 cr / msg
              </span>
              <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                <Mail className="w-3 h-3 text-sky-500" /> Email: 0.2 cr / email
              </span>
            </div>
            <span>All 3 channels draw from this single balance pool.</span>
          </div>
        </div>

        {/* ── 3 Channel Usage Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AI Calling Usage */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md">
                15 cr / min
              </span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">AI Calling Consumption</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {usage ? usage.calling.duration_minutes : 0} mins
              </span>
              <span className="text-xs text-zinc-400">({usage ? usage.calling.duration_seconds : 0}s)</span>
            </div>
            <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-1">
              Total: {usage ? usage.calling.credits_consumed.toLocaleString() : 0} credits deducted
            </p>
          </div>

          {/* WhatsApp Usage */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                0.1 cr / msg
              </span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">WhatsApp Consumption</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {usage ? usage.whatsapp.messages_sent.toLocaleString() : 0} msgs
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              Total: {usage ? usage.whatsapp.credits_consumed.toLocaleString() : 0} credits deducted
            </p>
          </div>

          {/* Email Usage */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md">
                0.2 cr / email
              </span>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email Consumption</h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {usage ? usage.email.emails_sent.toLocaleString() : 0} emails
              </span>
            </div>
            <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-1">
              Total: {usage ? usage.email.credits_consumed.toLocaleString() : 0} credits deducted
            </p>
          </div>
        </div>

        {/* ── Primary Ledger Container (Deductions vs Top-Ups & Grants) ── */}
        <div id="transactions-ledger" className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          
          {/* Main Tab Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Credit Records & Audit Trail</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Track exact deductions per campaign as well as top-ups, payments, and admin credits.
              </p>
            </div>

            {/* Primary Tab Pills */}
            <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200 dark:border-zinc-700/60">
              <button
                onClick={() => setActiveLedgerTab("deductions")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeLedgerTab === "deductions"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                Credit Deductions ({deductionsList.length})
              </button>
              <button
                onClick={() => setActiveLedgerTab("topups_grants")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeLedgerTab === "topups_grants"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                Top-Ups & Admin Grants ({topupsAndGrantsList.length})
              </button>
            </div>
          </div>

          {/* ── TAB 1: DEDUCTIONS HISTORY ── */}
          {activeLedgerTab === "deductions" && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: "all", label: "All Deductions" },
                    { key: "calling", label: "AI Calling Calls" },
                    { key: "whatsapp", label: "WhatsApp Messages" },
                    { key: "email", label: "Email Campaigns" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setDeductionFilter(f.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        deductionFilter === f.key
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-zinc-400">
                  Showing {filteredDeductions.length} deduction record{filteredDeductions.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Deductions Table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Channel / Activity</th>
                      <th className="py-3 px-4">Campaign / Reference</th>
                      <th className="py-3 px-4">Activity Description</th>
                      <th className="py-3 px-4 text-right">Credits Deducted</th>
                      <th className="py-3 px-4 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                    {filteredDeductions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <History className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">No credit deductions recorded yet.</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            When you run calling, email, or WhatsApp campaigns, every deduction will appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredDeductions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-4 text-[11px] whitespace-nowrap text-zinc-500">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              tx.service === "calling" || tx.type.includes("calling")
                                ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900"
                                : tx.service === "whatsapp" || tx.type.includes("whatsapp")
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
                                : tx.service === "email" || tx.type.includes("email")
                                ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            }`}>
                              {tx.service === "calling" ? <PhoneCall className="w-3 h-3" /> : tx.service === "whatsapp" ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                              {tx.service === "calling" ? "AI Call" : tx.service === "whatsapp" ? "WhatsApp" : tx.service === "email" ? "Email" : "Service"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                            {tx.reference_id || tx.transaction_id}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">
                            {tx.description}
                          </td>
                          <td className="py-3 px-4 text-right font-bold font-mono text-rose-600 dark:text-rose-400">
                            {tx.credits < 0 ? tx.credits.toFixed(2) : `-${tx.credits.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-white">
                            {tx.balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 2: TOP-UPS, PAYMENTS & ADMIN GRANTS ── */}
          {activeLedgerTab === "topups_grants" && (
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: "all", label: "All Additions" },
                    { key: "topup", label: "Top-Up Packages" },
                    { key: "admin", label: "Admin Grants & Adjustments" },
                    { key: "subscription", label: "Subscription Renewals" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setGrantFilter(f.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        grantFilter === f.key
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-zinc-400">
                  Showing {filteredTopupsAndGrants.length} transaction record{filteredTopupsAndGrants.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Source / Type</th>
                      <th className="py-3 px-4">Transaction / Ref ID</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Credits Added</th>
                      <th className="py-3 px-4 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                    {filteredTopupsAndGrants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <PlusCircle className="w-6 h-6 mx-auto mb-2 opacity-40 text-emerald-500" />
                          <p className="font-semibold">No top-ups or credit grants found.</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Purchased top-up packages and credits granted by admins will appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredTopupsAndGrants.map((tx) => {
                        const isAdmin = (tx.description && tx.description.toLowerCase().includes("admin")) || (tx.reference_id && tx.reference_id.startsWith("admin"));
                        return (
                          <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4 text-[11px] whitespace-nowrap text-zinc-500">
                              {tx.created_at ? new Date(tx.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                  <UserCheck className="w-3 h-3" /> Admin Grant
                                </span>
                              ) : tx.type.includes("subscription") ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                                  <Sparkles className="w-3 h-3" /> Subscription
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                  <CheckCircle2 className="w-3 h-3" /> Top-Up Payment
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                              {tx.reference_id || tx.transaction_id}
                            </td>
                            <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">
                              {tx.description}
                            </td>
                            <td className="py-3 px-4 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              +{tx.credits.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-white">
                              {tx.balance_after.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={handleTopUpSuccess}
      />
    </DashboardShell>
  );
}
